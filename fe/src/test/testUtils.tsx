import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { TranslationProject, MangaPage, TextBox } from '@/types'

// Mock data generators
export const createMockTextBox = (overrides: Partial<TextBox> = {}): TextBox => ({
  id: 'textbox-1',
  x: 0.1,
  y: 0.1,
  width: 0.2,
  height: 0.1,
  text: 'Hello',
  originalText: 'こんにちは',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  backgroundColor: '#ffffff',
  confidence: 0.95,
  sourceLanguage: 'ja',
  targetLanguage: 'en',
  ...overrides,
})

export const createMockMangaPage = (overrides: Partial<MangaPage> = {}): MangaPage => ({
  id: 'page-1',
  file: new File(['test'], 'test.png', { type: 'image/png' }),
  imageUrl: 'data:image/png;base64,test',
  textBoxes: [createMockTextBox()],
  originalTextBoxes: [createMockTextBox({ text: 'こんにちは' })],
  name: 'Page 1',
  status: 'completed',
  ...overrides,
})

export const createMockProject = (overrides: Partial<TranslationProject> = {}): TranslationProject => ({
  id: 'project-1',
  name: 'Test Project',
  pages: [createMockMangaPage()],
  targetLanguage: 'en',
  sourceLanguage: 'ja',
  createdAt: Date.now(),
  lastModified: Date.now(),
  ...overrides,
})

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
    </div>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Custom matchers
export const expectToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectToHaveClasses = (element: HTMLElement, ...classes: string[]) => {
  classes.forEach(className => {
    expect(element).toHaveClass(className)
  })
}

// Event helpers
export const createMockFile = (name = 'test.png', type = 'image/png'): File => {
  return new File(['test content'], name, { type })
}

export const createMockDragEvent = (files: File[] = [createMockFile()]): Partial<DragEvent> => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  dataTransfer: {
    files: files as any,
    items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })) as any,
    types: ['Files'],
    dropEffect: 'copy',
    effectAllowed: 'all',
    clearData: vi.fn(),
    getData: vi.fn(),
    setData: vi.fn(),
    setDragImage: vi.fn(),
  }
})

// Async helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Store testing helpers
export const createMockStoreState = () => ({
  project: createMockProject(),
  currentPageIndex: 0,
  selectedTextBox: null,
  isProcessing: false,
  showHistoryPanel: false,
  showExportPanel: false,
  showSettingsPanel: false,
  history: [],
  historyIndex: -1,
  settings: {
    autoSave: true,
    maxHistorySteps: 50,
    defaultTargetLanguage: 'en',
    theme: 'system' as const,
  },
})

// Mock functions
export const createMockFunctions = () => ({
  onFilesSelected: vi.fn(),
  onPageChange: vi.fn(),
  onTextBoxSelect: vi.fn(),
  onTextBoxUpdate: vi.fn(),
  onAddAction: vi.fn(),
  onClose: vi.fn(),
  onSubmit: vi.fn(),
})

// Assertions for async operations
export const expectAsyncOperationToComplete = async (operation: () => Promise<any>) => {
  let error: Error | null = null
  let result: any = null
  
  try {
    result = await operation()
  } catch (e) {
    error = e as Error
  }
  
  return {
    toSucceed: () => {
      expect(error).toBeNull()
      return result
    },
    toFail: () => {
      expect(error).not.toBeNull()
      return error
    },
    toFailWith: (expectedError: string | RegExp) => {
      expect(error).not.toBeNull()
      expect(error?.message).toMatch(expectedError)
      return error
    }
  }
}