export interface MangaPage {
  id: string
  file: File
  imageUrl: string
  textBoxes: TextBox[]
  originalTextBoxes: TextBox[]
  name: string
  status: 'processing' | 'completed' | 'error'
}

export interface TextBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  text: string
  originalText: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  color: string
  backgroundColor: string
  confidence: number
  sourceLanguage: string
  targetLanguage: string
}

export interface EditAction {
  id: string
  type: 'move' | 'resize' | 'edit' | 'add' | 'delete'
  pageId: string
  textBoxId: string
  before: Partial<TextBox>
  after: Partial<TextBox>
  timestamp: number
  description: string
}

export interface TranslationProject {
  id: string
  name: string
  pages: MangaPage[]
  targetLanguage: string
  sourceLanguage: string
  createdAt: number
  lastModified: number
}

export interface UploadProgress {
  file: string
  progress: number
  status: 'uploading' | 'processing' | 'translating' | 'complete' | 'error'
  message?: string
}

export interface AppSettings {
  autoSave: boolean
  maxHistorySteps: number
  defaultTargetLanguage: string
  theme: 'light' | 'dark' | 'system'
}

// Form schemas
export interface FileUploadFormData {
  files: FileList
  targetLanguage: string
  sourceLanguage: string
}

export interface TextEditFormData {
  text: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  color: string
  backgroundColor: string
}

export interface ProjectSettingsFormData {
  name: string
  targetLanguage: string
  sourceLanguage: string
}