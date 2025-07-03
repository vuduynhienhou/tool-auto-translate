# Custom Hooks Documentation

This document provides comprehensive documentation for all custom hooks used in the Manga Translator application.

## Table of Contents

- [State Management Hooks](#state-management-hooks)
- [Async Operation Hooks](#async-operation-hooks)
- [Form Management Hooks](#form-management-hooks)
- [UI Interaction Hooks](#ui-interaction-hooks)
- [Utility Hooks](#utility-hooks)

## State Management Hooks

### `useAppStore`

Central state management hook using Zustand for the entire application state.

```typescript
const {
  project,
  currentPageIndex,
  selectedTextBox,
  isProcessing,
  // ... other state and actions
} = useAppStore()
```

**State Properties:**
- `project: TranslationProject | null` - Current active project
- `currentPageIndex: number` - Index of currently viewed page
- `selectedTextBox: {pageId: string, textBoxId: string} | null` - Currently selected text box
- `isProcessing: boolean` - Whether app is processing files
- `showHistoryPanel: boolean` - History panel visibility
- `showExportPanel: boolean` - Export panel visibility
- `showSettingsPanel: boolean` - Settings panel visibility
- `history: EditAction[]` - Edit history stack
- `historyIndex: number` - Current position in history
- `settings: AppSettings` - Application settings

**Actions:**
- `setProject(project)` - Set active project
- `updateTextBox(pageId, textBoxId, updates)` - Update text box properties
- `deleteTextBox(pageId, textBoxId)` - Remove text box
- `addTextBox(pageId, textBox)` - Add new text box
- `undo()` - Undo last action
- `redo()` - Redo last undone action
- `addToHistory(action)` - Add action to history

**Optimized Selectors:**
```typescript
// Use these for better performance (avoid unnecessary re-renders)
const currentPage = useCurrentPage()
const selectedTextBox = useSelectedTextBox()
const uiState = useUIState()
const projectState = useProjectState()
const actions = useAppActions()
```

### `useEditHistory`

Specialized hook for managing undo/redo functionality.

```typescript
const {
  history,
  currentIndex,
  addToHistory,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory
} = useEditHistory(maxHistorySteps?)
```

**Parameters:**
- `maxHistorySteps?: number` - Maximum number of history items (default: 50)

**Returns:**
- `history: EditAction[]` - Array of edit actions
- `currentIndex: number` - Current position in history
- `addToHistory: (action: EditAction) => void` - Add action to history
- `undo: () => EditAction | null` - Undo last action
- `redo: () => EditAction | null` - Redo next action
- `canUndo: boolean` - Whether undo is possible
- `canRedo: boolean` - Whether redo is possible
- `clearHistory: () => void` - Clear all history

**Usage Example:**
```typescript
const { addToHistory, undo, redo, canUndo, canRedo } = useEditHistory(100)

// Add an action to history
addToHistory({
  id: 'action-1',
  type: 'edit',
  pageId: 'page-1',
  textBoxId: 'tb-1',
  before: { text: 'old text' },
  after: { text: 'new text' },
  timestamp: Date.now(),
  description: 'Text edited'
})

// Undo/redo
if (canUndo) {
  const undoneAction = undo()
}
```

## Async Operation Hooks

### `useAsyncOperation`

Generic hook for handling async operations with loading states, error handling, and toast notifications.

```typescript
const {
  execute,
  isLoading,
  error,
  reset
} = useAsyncOperation<T>()
```

**Returns:**
- `execute: (operation, options?) => Promise<T>` - Execute async operation
- `isLoading: boolean` - Whether operation is in progress
- `error: string | null` - Error message if operation failed
- `reset: () => void` - Reset error and loading state

**Options:**
```typescript
interface AsyncOperationOptions<T> {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}
```

**Usage Example:**
```typescript
const { execute, isLoading, error } = useAsyncOperation<string>()

const handleTranslate = async () => {
  await execute(
    () => translateText('こんにちは', 'ja', 'en'),
    {
      successMessage: 'Translation completed!',
      errorMessage: 'Translation failed',
      onSuccess: (translation) => console.log('Result:', translation),
      onError: (error) => console.error('Error:', error)
    }
  )
}
```

### `useToast`

Hook for displaying toast notifications.

```typescript
const { toast } = useToast()

toast({
  title: 'Success',
  description: 'Operation completed successfully',
  variant: 'default' | 'destructive'
})
```

## Form Management Hooks

### `useFormWithValidation`

Enhanced form hook with Zod validation and improved developer experience.

```typescript
const form = useFormWithValidation({
  schema: zodSchema,
  defaultValues: { /* initial values */ }
})
```

**Parameters:**
```typescript
interface FormWithValidationOptions<T> {
  schema: z.ZodSchema<T>;
  defaultValues?: T;
  // ... other react-hook-form options
}
```

**Returns (extends react-hook-form):**
- `hasErrors: boolean` - Whether form has validation errors
- `errorCount: number` - Number of validation errors
- `isSubmitting: boolean` - Whether form is being submitted
- `isDirty: boolean` - Whether form has been modified
- `submitWithToast: (onSubmit, successMsg?, errorMsg?) => Promise<void>` - Submit with toast notifications

**Usage Example:**
```typescript
const uploadSchema = z.object({
  files: z.instanceof(FileList).refine(files => files.length > 0),
  sourceLanguage: z.string(),
  targetLanguage: z.string()
})

const form = useFormWithValidation({
  schema: uploadSchema,
  defaultValues: {
    sourceLanguage: 'auto',
    targetLanguage: 'en'
  }
})

const onSubmit = async (data) => {
  await processFiles(data.files, data.sourceLanguage, data.targetLanguage)
}

return (
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* form fields */}
    {form.hasErrors && <p>Please fix {form.errorCount} errors</p>}
  </form>
)
```

## UI Interaction Hooks

### `useDragAndDrop`

Hook for handling drag-and-drop file operations.

```typescript
const {
  dragActive,
  dragProps,
  inputProps
} = useDragAndDrop(onDrop, options?)
```

**Parameters:**
- `onDrop: (files: File[]) => void` - Callback when files are dropped
- `options?: DragAndDropOptions` - Configuration options

**Options:**
```typescript
interface DragAndDropOptions {
  validateFiles?: (files: File[]) => File[];
  multiple?: boolean;
  maxFiles?: number;
}
```

**Returns:**
- `dragActive: boolean` - Whether drag is currently active
- `dragProps: object` - Props to spread on drag target
- `inputProps: object` - Props to spread on file input

**Usage Example:**
```typescript
const validateImageFiles = (files: File[]) => 
  files.filter(file => file.type.startsWith('image/'))

const { dragActive, dragProps, inputProps } = useDragAndDrop(
  handleFileDrop,
  {
    validateFiles: validateImageFiles,
    maxFiles: 10,
    multiple: true
  }
)

return (
  <div 
    className={`drop-zone ${dragActive ? 'active' : ''}`}
    {...dragProps}
  >
    <input type="file" {...inputProps} />
    Drop files here or click to browse
  </div>
)
```

## Utility Hooks

### `useUndoRedo`

Generic undo/redo functionality for any type of data.

```typescript
const {
  history,
  currentIndex,
  addToHistory,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory
} = useUndoRedo<T>(maxHistory?)
```

**Parameters:**
- `maxHistory?: number` - Maximum history size (default: 50)

**Generic Type:**
- `T` - Type of data being tracked in history

**Usage Example:**
```typescript
interface DocumentState {
  title: string;
  content: string;
}

const {
  addToHistory,
  undo,
  redo,
  canUndo,
  canRedo
} = useUndoRedo<DocumentState>(100)

// Track changes
const updateDocument = (newState: DocumentState) => {
  addToHistory(newState)
  setDocument(newState)
}

// Undo/redo
const handleUndo = () => {
  const previousState = undo()
  if (previousState) {
    setDocument(previousState)
  }
}
```

## Best Practices

### 1. Performance Optimization

```typescript
// ✅ Good - Use specific selectors
const currentPage = useCurrentPage()
const isProcessing = useAppStore(state => state.isProcessing)

// ❌ Bad - Subscribes to all state changes
const { currentPage, isProcessing } = useAppStore()
```

### 2. Error Handling

```typescript
// ✅ Good - Handle errors with useAsyncOperation
const { execute, isLoading, error } = useAsyncOperation()

const handleOperation = () => {
  execute(
    () => riskyOperation(),
    {
      errorMessage: 'Operation failed. Please try again.',
      onError: (error) => {
        // Additional error handling
        analytics.track('operation_failed', { error: error.message })
      }
    }
  )
}

// ❌ Bad - Manual error handling
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)

const handleOperation = async () => {
  try {
    setIsLoading(true)
    await riskyOperation()
  } catch (error) {
    setError(error.message)
    // Easy to forget toast notifications
  } finally {
    setIsLoading(false)
  }
}
```

### 3. Form Validation

```typescript
// ✅ Good - Use schema-based validation
const form = useFormWithValidation({
  schema: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password too short')
  })
})

// ❌ Bad - Manual validation
const [errors, setErrors] = useState({})

const validate = (values) => {
  const newErrors = {}
  if (!isEmail(values.email)) {
    newErrors.email = 'Invalid email'
  }
  // More validation logic...
  setErrors(newErrors)
}
```

### 4. State Management

```typescript
// ✅ Good - Use optimized selectors
const actions = useAppActions() // Only actions, no state
const uiState = useUIState() // Only UI state

// ❌ Bad - Subscribe to entire store
const store = useAppStore() // Re-renders on any state change
```

## Testing Hooks

All custom hooks should be tested using `@testing-library/react-hooks`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAsyncOperation } from '../useAsyncOperation'

test('useAsyncOperation handles success', async () => {
  const { result } = renderHook(() => useAsyncOperation())
  
  const mockOperation = vi.fn().mockResolvedValue('success')
  
  await act(async () => {
    const response = await result.current.execute(mockOperation)
    expect(response).toBe('success')
  })
  
  expect(result.current.isLoading).toBe(false)
  expect(result.current.error).toBe(null)
})
```

## Migration Guide

### From Old Store to Optimized Store

```typescript
// Before
const {
  project,
  currentPageIndex,
  selectedTextBox,
  updateTextBox
} = useAppStore()

// After (better performance)
const currentPage = useCurrentPage()
const selectedTextBox = useSelectedTextBox()
const { updateTextBox } = useAppActions()
```

### From Manual Async to useAsyncOperation

```typescript
// Before
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)

const handleSubmit = async () => {
  try {
    setIsLoading(true)
    setError(null)
    await submitData()
    toast({ title: 'Success!' })
  } catch (err) {
    setError(err.message)
    toast({ title: 'Error', variant: 'destructive' })
  } finally {
    setIsLoading(false)
  }
}

// After
const { execute, isLoading, error } = useAsyncOperation()

const handleSubmit = () => {
  execute(
    () => submitData(),
    { successMessage: 'Success!' }
  )
}
```