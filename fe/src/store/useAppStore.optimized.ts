import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { TextBox, EditAction, TranslationProject, AppSettings } from '@/types'

interface AppState {
  // Project state
  project: TranslationProject | null
  currentPageIndex: number
  selectedTextBox: { pageId: string; textBoxId: string } | null
  
  // UI state
  isProcessing: boolean
  showHistoryPanel: boolean
  showExportPanel: boolean
  showSettingsPanel: boolean
  
  // Edit history
  history: EditAction[]
  historyIndex: number
  
  // Settings
  settings: AppSettings
}

interface AppActions {
  // Basic setters
  setProject: (project: TranslationProject | null) => void
  setCurrentPageIndex: (index: number) => void
  setSelectedTextBox: (selection: { pageId: string; textBoxId: string } | null) => void
  setIsProcessing: (processing: boolean) => void
  setShowHistoryPanel: (show: boolean) => void
  setShowExportPanel: (show: boolean) => void
  setShowSettingsPanel: (show: boolean) => void
  
  // Project actions
  updateTextBox: (pageId: string, textBoxId: string, updates: Partial<TextBox>) => void
  deleteTextBox: (pageId: string, textBoxId: string) => void
  addTextBox: (pageId: string, textBox: TextBox) => void
  
  // History actions
  addToHistory: (action: EditAction) => void
  undo: () => EditAction | null
  redo: () => EditAction | null
  clearHistory: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void
  
  // Computed selectors
  getCurrentPage: () => TranslationProject['pages'][0] | null
  getSelectedTextBox: () => TextBox | null
  getPageById: (pageId: string) => TranslationProject['pages'][0] | null
  getTextBoxById: (pageId: string, textBoxId: string) => TextBox | null
}

type AppStore = AppState & AppActions

const defaultSettings: AppSettings = {
  autoSave: true,
  maxHistorySteps: 50,
  defaultTargetLanguage: 'en',
  theme: 'system',
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer<AppStore>((set, get) => ({
          // Initial state
          project: null,
          currentPageIndex: 0,
          selectedTextBox: null,
          isProcessing: false,
          showHistoryPanel: false,
          showExportPanel: false,
          showSettingsPanel: false,
          history: [],
          historyIndex: -1,
          settings: defaultSettings,

          // Basic setters - optimized with immer
          setProject: (project) => set((state) => {
            state.project = project
            state.currentPageIndex = 0
            state.selectedTextBox = null
            state.history = []
            state.historyIndex = -1
          }),

          setCurrentPageIndex: (index) => set((state) => {
            state.currentPageIndex = index
            state.selectedTextBox = null // Clear selection when changing pages
          }),

          setSelectedTextBox: (selection) => set((state) => {
            state.selectedTextBox = selection
          }),

          setIsProcessing: (processing) => set((state) => {
            state.isProcessing = processing
          }),

          setShowHistoryPanel: (show) => set((state) => {
            state.showHistoryPanel = show
          }),

          setShowExportPanel: (show) => set((state) => {
            state.showExportPanel = show
          }),

          setShowSettingsPanel: (show) => set((state) => {
            state.showSettingsPanel = show
          }),

          // Project actions - optimized with immer for immutable updates
          updateTextBox: (pageId, textBoxId, updates) => {
            const state = get()
            const oldTextBox = state.getTextBoxById(pageId, textBoxId)
            
            if (!oldTextBox) return

            set((draft) => {
              const page = draft.project?.pages.find(p => p.id === pageId)
              if (!page) return

              const textBox = page.textBoxes.find(tb => tb.id === textBoxId)
              if (!textBox) return

              Object.assign(textBox, updates)
              
              if (draft.project) {
                draft.project.lastModified = Date.now()
              }
            })

            // Add to history after state update
            get().addToHistory({
              id: `action-${Date.now()}`,
              type: 'edit',
              pageId,
              textBoxId,
              before: oldTextBox,
              after: { ...oldTextBox, ...updates },
              timestamp: Date.now(),
              description: `Edited text box`,
            })
          },

          deleteTextBox: (pageId, textBoxId) => {
            const state = get()
            const textBox = state.getTextBoxById(pageId, textBoxId)
            
            if (!textBox) return

            set((draft) => {
              const page = draft.project?.pages.find(p => p.id === pageId)
              if (!page) return

              page.textBoxes = page.textBoxes.filter(tb => tb.id !== textBoxId)
              
              if (draft.project) {
                draft.project.lastModified = Date.now()
              }
              
              if (draft.selectedTextBox?.textBoxId === textBoxId) {
                draft.selectedTextBox = null
              }
            })

            get().addToHistory({
              id: `action-${Date.now()}`,
              type: 'delete',
              pageId,
              textBoxId,
              before: textBox,
              after: {},
              timestamp: Date.now(),
              description: `Deleted text box`,
            })
          },

          addTextBox: (pageId, textBox) => {
            set((draft) => {
              const page = draft.project?.pages.find(p => p.id === pageId)
              if (!page) return

              page.textBoxes.push(textBox)
              
              if (draft.project) {
                draft.project.lastModified = Date.now()
              }
            })

            get().addToHistory({
              id: `action-${Date.now()}`,
              type: 'add',
              pageId,
              textBoxId: textBox.id,
              before: {},
              after: textBox,
              timestamp: Date.now(),
              description: `Added text box`,
            })
          },

          // History actions - optimized
          addToHistory: (action) => set((draft) => {
            // Clear future history if we're not at the end
            if (draft.historyIndex < draft.history.length - 1) {
              draft.history = draft.history.slice(0, draft.historyIndex + 1)
            }
            
            draft.history.push(action)
            
            // Limit history size
            if (draft.history.length > draft.settings.maxHistorySteps) {
              draft.history.shift()
            } else {
              draft.historyIndex = draft.history.length - 1
            }
          }),

          undo: () => {
            const state = get()
            if (!state.canUndo()) return null

            const action = state.history[state.historyIndex]
            
            set((draft) => {
              draft.historyIndex -= 1
            })
            
            return action
          },

          redo: () => {
            const state = get()
            if (!state.canRedo()) return null

            const nextIndex = state.historyIndex + 1
            const action = state.history[nextIndex]
            
            set((draft) => {
              draft.historyIndex = nextIndex
            })
            
            return action
          },

          clearHistory: () => set((draft) => {
            draft.history = []
            draft.historyIndex = -1
          }),

          canUndo: () => get().historyIndex >= 0,
          canRedo: () => get().historyIndex < get().history.length - 1,

          // Settings actions
          updateSettings: (newSettings) => set((draft) => {
            Object.assign(draft.settings, newSettings)
          }),

          // Computed selectors - memoized for performance
          getCurrentPage: () => {
            const state = get()
            if (!state.project || state.currentPageIndex < 0 || state.currentPageIndex >= state.project.pages.length) {
              return null
            }
            return state.project.pages[state.currentPageIndex]
          },

          getSelectedTextBox: () => {
            const state = get()
            if (!state.selectedTextBox) return null
            
            return state.getTextBoxById(state.selectedTextBox.pageId, state.selectedTextBox.textBoxId)
          },

          getPageById: (pageId: string) => {
            const state = get()
            return state.project?.pages.find(page => page.id === pageId) || null
          },

          getTextBoxById: (pageId: string, textBoxId: string) => {
            const state = get()
            const page = state.getPageById(pageId)
            return page?.textBoxes.find(textBox => textBox.id === textBoxId) || null
          },
        }))
      ),
      {
        name: 'manga-translator-storage',
        partialize: (state) => ({ 
          settings: state.settings,
          project: state.project 
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle version migrations if needed
          if (version === 0) {
            // Migration logic for v0 to v1
            return {
              ...persistedState,
              settings: { ...defaultSettings, ...persistedState.settings }
            }
          }
          return persistedState
        }
      }
    ),
    { name: 'manga-translator' }
  )
)

// Optimized selectors for better performance
export const useCurrentPage = () => useAppStore((state) => state.getCurrentPage())
export const useSelectedTextBox = () => useAppStore((state) => state.getSelectedTextBox())
export const useCanUndo = () => useAppStore((state) => state.canUndo())
export const useCanRedo = () => useAppStore((state) => state.canRedo())

// Selector for UI state only (prevents unnecessary re-renders)
export const useUIState = () => useAppStore((state) => ({
  isProcessing: state.isProcessing,
  showHistoryPanel: state.showHistoryPanel,
  showExportPanel: state.showExportPanel,
  showSettingsPanel: state.showSettingsPanel,
}))

// Selector for project data only
export const useProjectState = () => useAppStore((state) => ({
  project: state.project,
  currentPageIndex: state.currentPageIndex,
  selectedTextBox: state.selectedTextBox,
}))

// Action selectors (these don't cause re-renders)
export const useAppActions = () => useAppStore((state) => ({
  setProject: state.setProject,
  setCurrentPageIndex: state.setCurrentPageIndex,
  setSelectedTextBox: state.setSelectedTextBox,
  setIsProcessing: state.setIsProcessing,
  updateTextBox: state.updateTextBox,
  deleteTextBox: state.deleteTextBox,
  addTextBox: state.addTextBox,
  addToHistory: state.addToHistory,
  undo: state.undo,
  redo: state.redo,
  clearHistory: state.clearHistory,
  updateSettings: state.updateSettings,
}))

// Hook for auto-save functionality
export const useAutoSave = () => {
  const settings = useAppStore((state) => state.settings)
  const project = useAppStore((state) => state.project)
  
  // Auto-save logic can be implemented here
  // This is a placeholder for the actual auto-save implementation
  return settings.autoSave && project !== null
}