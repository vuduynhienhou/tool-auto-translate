import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageViewer from '../ImageViewer'
import { render, createMockProject, createMockMangaPage, createMockTextBox, createMockFunctions } from '@/test/testUtils'

describe('ImageViewer', () => {
  const mockFunctions = createMockFunctions()
  const mockProject = createMockProject()
  
  const defaultProps = {
    pages: mockProject.pages,
    currentPageIndex: 0,
    onPageChange: mockFunctions.onPageChange,
    onTextBoxSelect: mockFunctions.onTextBoxSelect,
    onTextBoxUpdate: mockFunctions.onTextBoxUpdate,
    selectedTextBox: null,
    onAddAction: mockFunctions.onAddAction,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page name and controls', () => {
    render(<ImageViewer {...defaultProps} />)
    
    expect(screen.getByText(mockProject.pages[0].name)).toBeInTheDocument()
    expect(screen.getByText(/100%/)).toBeInTheDocument() // Zoom level
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
  })

  it('displays image with correct src', () => {
    render(<ImageViewer {...defaultProps} />)
    
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', mockProject.pages[0].imageUrl)
    expect(image).toHaveAttribute('alt', mockProject.pages[0].name)
  })

  it('handles zoom in and out', async () => {
    const user = userEvent.setup()
    render(<ImageViewer {...defaultProps} />)
    
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
    const zoomOutButton = screen.getByRole('button', { name: /zoom out/i })
    
    // Initial zoom should be 100%
    expect(screen.getByText('100%')).toBeInTheDocument()
    
    // Zoom in
    await user.click(zoomInButton)
    expect(screen.getByText('120%')).toBeInTheDocument()
    
    // Zoom out
    await user.click(zoomOutButton)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('toggles between original and translated view', async () => {
    const user = userEvent.setup()
    render(<ImageViewer {...defaultProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /show original/i })
    
    // Should show translated by default
    expect(toggleButton).toHaveTextContent('Show Original')
    
    // Toggle to original
    await user.click(toggleButton)
    expect(toggleButton).toHaveTextContent('Hide Original')
    
    // Toggle back to translated
    await user.click(toggleButton)
    expect(toggleButton).toHaveTextContent('Show Original')
  })

  it('renders text boxes', () => {
    const pageWithTextBoxes = createMockMangaPage({
      textBoxes: [
        createMockTextBox({ id: 'tb1', text: 'Hello' }),
        createMockTextBox({ id: 'tb2', text: 'World' })
      ]
    })
    
    render(<ImageViewer {...defaultProps} pages={[pageWithTextBoxes]} />)
    
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('World')).toBeInTheDocument()
  })

  it('highlights selected text box', () => {
    const pageWithTextBoxes = createMockMangaPage({
      textBoxes: [createMockTextBox({ id: 'tb1', text: 'Hello' })]
    })
    
    render(<ImageViewer 
      {...defaultProps} 
      pages={[pageWithTextBoxes]}
      selectedTextBox={{ pageId: pageWithTextBoxes.id, textBoxId: 'tb1' }}
    />)
    
    const textBox = screen.getByText('Hello').parentElement
    expect(textBox).toHaveClass('border-blue-500') // Selected state class
  })

  it('handles text box selection', async () => {
    const user = userEvent.setup()
    const pageWithTextBoxes = createMockMangaPage({
      textBoxes: [createMockTextBox({ id: 'tb1', text: 'Hello' })]
    })
    
    render(<ImageViewer {...defaultProps} pages={[pageWithTextBoxes]} />)
    
    const textBox = screen.getByText('Hello')
    await user.click(textBox)
    
    expect(mockFunctions.onTextBoxSelect).toHaveBeenCalledWith(pageWithTextBoxes.id, 'tb1')
  })

  it('handles text box dragging', async () => {
    const pageWithTextBoxes = createMockMangaPage({
      textBoxes: [createMockTextBox({ id: 'tb1', text: 'Hello', x: 0.1, y: 0.1 })]
    })
    
    render(<ImageViewer {...defaultProps} pages={[pageWithTextBoxes]} />)
    
    const textBox = screen.getByText('Hello')
    
    // Simulate mouse down
    fireEvent.mouseDown(textBox, { clientX: 100, clientY: 100 })
    
    // Simulate mouse move
    fireEvent.mouseMove(textBox, { clientX: 150, clientY: 150 })
    
    // Simulate mouse up
    fireEvent.mouseUp(textBox)
    
    // Should trigger onAddAction for move action
    expect(mockFunctions.onAddAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'move',
        pageId: pageWithTextBoxes.id,
        textBoxId: 'tb1',
        description: 'Moved text box to new position'
      })
    )
  })

  it('changes pages correctly', async () => {
    const user = userEvent.setup()
    const multiplePagesProject = createMockProject({
      pages: [
        createMockMangaPage({ id: 'page1', name: 'Page 1' }),
        createMockMangaPage({ id: 'page2', name: 'Page 2' })
      ]
    })
    
    render(<ImageViewer {...defaultProps} pages={multiplePagesProject.pages} />)
    
    const pageSelect = screen.getByDisplayValue('1 - Page 1')
    
    await user.selectOptions(pageSelect, '1')
    
    expect(mockFunctions.onPageChange).toHaveBeenCalledWith(1)
  })

  it('shows settings dialog when settings button is clicked', async () => {
    const user = userEvent.setup()
    render(<ImageViewer {...defaultProps} />)
    
    const settingsButton = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsButton)
    
    // Settings dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('handles empty pages gracefully', () => {
    render(<ImageViewer {...defaultProps} pages={[]} currentPageIndex={0} />)
    
    expect(screen.getByText(/no pages loaded/i)).toBeInTheDocument()
  })

  it('applies zoom transformation to image container', async () => {
    const user = userEvent.setup()
    render(<ImageViewer {...defaultProps} />)
    
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
    await user.click(zoomInButton)
    
    const imageContainer = screen.getByRole('img').parentElement
    expect(imageContainer).toHaveStyle('transform: scale(1.2)')
  })

  it('prevents text box selection when dragging', async () => {
    const pageWithTextBoxes = createMockMangaPage({
      textBoxes: [createMockTextBox({ id: 'tb1', text: 'Hello' })]
    })
    
    render(<ImageViewer {...defaultProps} pages={[pageWithTextBoxes]} />)
    
    const textBox = screen.getByText('Hello')
    
    // Start dragging
    fireEvent.mouseDown(textBox, { clientX: 100, clientY: 100 })
    
    // Move enough to trigger drag
    fireEvent.mouseMove(textBox, { clientX: 150, clientY: 150 })
    
    // Click should not trigger selection during drag
    fireEvent.click(textBox)
    
    expect(mockFunctions.onTextBoxSelect).not.toHaveBeenCalled()
  })
})