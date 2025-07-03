import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '../upload/FileUpload'
import { render, createMockFile, createMockDragEvent, createMockFunctions } from '@/test/testUtils'

describe('FileUpload', () => {
  const mockFunctions = createMockFunctions()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload area with correct text', () => {
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    expect(screen.getByText(/browse files/i)).toBeInTheDocument()
    expect(screen.getByText(/supported formats/i)).toBeInTheDocument()
  })

  it('shows processing state when isProcessing is true', () => {
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={true} />)
    
    expect(screen.getByText(/processing/i)).toBeInTheDocument()
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('handles file selection through input', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    const fileInput = screen.getByLabelText(/browse files/i)
    const file = createMockFile('test.png', 'image/png')
    
    await user.upload(fileInput, file)
    
    expect(mockFunctions.onFilesSelected).toHaveBeenCalledWith({
      files: expect.any(FileList),
      sourceLanguage: 'auto',
      targetLanguage: 'en'
    })
  })

  it('handles drag and drop', async () => {
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    const dropArea = screen.getByText(/drag and drop/i).closest('div')
    const files = [createMockFile('test.png', 'image/png')]
    const dragEvent = createMockDragEvent(files)
    
    // Simulate drag over
    fireEvent.dragOver(dropArea!, dragEvent as DragEvent)
    expect(dropArea).toHaveClass('border-blue-500') // or whatever active class is used
    
    // Simulate drop
    fireEvent.drop(dropArea!, dragEvent as DragEvent)
    
    await waitFor(() => {
      expect(mockFunctions.onFilesSelected).toHaveBeenCalled()
    })
  })

  it('validates file types', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    const fileInput = screen.getByLabelText(/browse files/i)
    const invalidFile = createMockFile('test.txt', 'text/plain')
    
    await user.upload(fileInput, invalidFile)
    
    // Should not call onFilesSelected for invalid file
    expect(mockFunctions.onFilesSelected).not.toHaveBeenCalled()
  })

  it('validates file size', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    const fileInput = screen.getByLabelText(/browse files/i)
    // Mock a large file by overriding the size property
    const largeFile = Object.defineProperty(
      createMockFile('large.png', 'image/png'),
      'size',
      { value: 20 * 1024 * 1024 } // 20MB
    )
    
    await user.upload(fileInput, largeFile)
    
    // Should not call onFilesSelected for oversized file
    expect(mockFunctions.onFilesSelected).not.toHaveBeenCalled()
  })

  it('updates language selection', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    const sourceSelect = screen.getByLabelText(/source language/i)
    const targetSelect = screen.getByLabelText(/target language/i)
    
    await user.selectOptions(sourceSelect, 'ja')
    await user.selectOptions(targetSelect, 'es')
    
    const fileInput = screen.getByLabelText(/browse files/i)
    const file = createMockFile('test.png', 'image/png')
    
    await user.upload(fileInput, file)
    
    expect(mockFunctions.onFilesSelected).toHaveBeenCalledWith({
      files: expect.any(FileList),
      sourceLanguage: 'ja',
      targetLanguage: 'es'
    })
  })

  it('shows error for empty file selection', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    const submitButton = screen.getByRole('button', { name: /browse files/i })
    
    await user.click(submitButton)
    
    // Should show validation error
    expect(screen.getByText(/please select at least one file/i)).toBeInTheDocument()
  })

  it('clears validation errors when files are selected', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    const submitButton = screen.getByRole('button', { name: /browse files/i })
    const fileInput = screen.getByLabelText(/browse files/i)
    
    // Trigger validation error
    await user.click(submitButton)
    expect(screen.getByText(/please select at least one file/i)).toBeInTheDocument()
    
    // Select a file
    const file = createMockFile('test.png', 'image/png')
    await user.upload(fileInput, file)
    
    // Error should be cleared
    expect(screen.queryByText(/please select at least one file/i)).not.toBeInTheDocument()
  })

  it('maintains drag state correctly', () => {
    render(<FileUpload onFilesSelected={mockFunctions.onFilesSelected} isProcessing={false} />)
    
    const dropArea = screen.getByText(/drag and drop/i).closest('div')
    const dragEvent = createMockDragEvent()
    
    // Drag enter
    fireEvent.dragEnter(dropArea!, dragEvent as DragEvent)
    expect(dropArea).toHaveClass('border-blue-500') // Active state class
    
    // Drag leave
    fireEvent.dragLeave(dropArea!, dragEvent as DragEvent)
    expect(dropArea).not.toHaveClass('border-blue-500') // No longer active
  })
})