import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { MangaPage, TextBox, EditAction, TranslationProject, AppSettings } from '@/types'

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
  
  // Actions
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
}

const defaultSettings: AppSettings = {
  autoSave: true,
  maxHistorySteps: 50,
  defaultTargetLanguage: 'en',
  theme: 'system',
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
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

        // Basic setters
        setProject: (project) => set({ project, currentPageIndex: 0, selectedTextBox: null }),
        setCurrentPageIndex: (index) => set({ currentPageIndex: index }),
        setSelectedTextBox: (selection) => set({ selectedTextBox: selection }),
        setIsProcessing: (processing) => set({ isProcessing: processing }),
        setShowHistoryPanel: (show) => set({ showHistoryPanel: show }),
        setShowExportPanel: (show) => set({ showExportPanel: show }),
        setShowSettingsPanel: (show) => set({ showSettingsPanel: show }),

        // Project actions
        updateTextBox: (pageId, textBoxId, updates) => {
          const state = get()
          if (!state.project) return

          const oldTextBox = state.project.pages
            .find(p => p.id === pageId)
            ?.textBoxes.find(tb => tb.id === textBoxId)

          if (!oldTextBox) return

          const newTextBox = { ...oldTextBox, ...updates }

          set({
            project: {
              ...state.project,
              pages: state.project.pages.map(page =>
                page.id === pageId
                  ? {
                      ...page,
                      textBoxes: page.textBoxes.map(textBox =>
                        textBox.id === textBoxId ? newTextBox : textBox
                      )
                    }
                  : page
              ),
              lastModified: Date.now(),
            }
          })

          // Add to history
          get().addToHistory({
            id: `action-${Date.now()}`,
            type: 'edit',
            pageId,
            textBoxId,
            before: oldTextBox,
            after: newTextBox,
            timestamp: Date.now(),
            description: `Edited text box`,
          })
        },

        deleteTextBox: (pageId, textBoxId) => {
          const state = get()
          if (!state.project) return

          const textBox = state.project.pages
            .find(p => p.id === pageId)
            ?.textBoxes.find(tb => tb.id === textBoxId)

          if (!textBox) return

          set({
            project: {
              ...state.project,
              pages: state.project.pages.map(page =>
                page.id === pageId
                  ? {
                      ...page,
                      textBoxes: page.textBoxes.filter(tb => tb.id !== textBoxId)
                    }
                  : page
              ),
              lastModified: Date.now(),
            },
            selectedTextBox: null,
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
          const state = get()
          if (!state.project) return

          set({
            project: {
              ...state.project,
              pages: state.project.pages.map(page =>
                page.id === pageId
                  ? {
                      ...page,
                      textBoxes: [...page.textBoxes, textBox]
                    }
                  : page
              ),
              lastModified: Date.now(),
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

        // History actions
        addToHistory: (action) => {
          const state = get()
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push(action)

          if (newHistory.length > state.settings.maxHistorySteps) {
            newHistory.shift()
          }

          set({
            history: newHistory,
            historyIndex: newHistory.length - 1,
          })
        },

        undo: () => {
          const state = get()
          if (state.historyIndex < 0) return null

          const action = state.history[state.historyIndex]
          set({ historyIndex: state.historyIndex - 1 })
          return action
        },

        redo: () => {
          const state = get()
          if (state.historyIndex >= state.history.length - 1) return null

          const action = state.history[state.historyIndex + 1]
          set({ historyIndex: state.historyIndex + 1 })
          return action
        },

        clearHistory: () => set({ history: [], historyIndex: -1 }),

        canUndo: () => get().historyIndex >= 0,
        canRedo: () => get().historyIndex < get().history.length - 1,

        // Settings actions
        updateSettings: (newSettings) => {
          const state = get()
          set({
            settings: { ...state.settings, ...newSettings }
          })
        },
      }),
      {
        name: 'manga-translator-storage',
        partialize: (state) => ({ 
          settings: state.settings,
          project: state.project 
        }),
      }
    ),
    { name: 'manga-translator' }
  )
)