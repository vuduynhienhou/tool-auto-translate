import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsyncOperation } from '../useAsyncOperation'

// Mock useToast
vi.mock('../useToast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('useAsyncOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAsyncOperation())
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(typeof result.current.execute).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  it('should handle successful operation', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>())
    
    const mockOperation = vi.fn().mockResolvedValue('success')
    const mockOnSuccess = vi.fn()
    
    let executeResult: string | undefined
    
    await act(async () => {
      executeResult = await result.current.execute(mockOperation, {
        successMessage: 'Operation completed',
        onSuccess: mockOnSuccess
      })
    })
    
    expect(mockOperation).toHaveBeenCalledTimes(1)
    expect(mockOnSuccess).toHaveBeenCalledWith('success')
    expect(executeResult).toBe('success')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle failed operation', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    
    const mockError = new Error('Operation failed')
    const mockOperation = vi.fn().mockRejectedValue(mockError)
    const mockOnError = vi.fn()
    
    let thrownError: Error | null = null
    
    await act(async () => {
      try {
        await result.current.execute(mockOperation, {
          errorMessage: 'Custom error message',
          onError: mockOnError
        })
      } catch (error) {
        thrownError = error as Error
      }
    })
    
    expect(mockOperation).toHaveBeenCalledTimes(1)
    expect(mockOnError).toHaveBeenCalledWith(mockError)
    expect(thrownError).toBe(mockError)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Custom error message')
  })

  it('should set loading state during operation', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    
    const mockOperation = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('success'), 100))
    )
    
    act(() => {
      result.current.execute(mockOperation)
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useAsyncOperation())
    
    // Set some state
    act(() => {
      result.current.execute(vi.fn().mockRejectedValue(new Error('test')))
        .catch(() => {}) // Ignore the error for this test
    })
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.error).toBe(null)
    expect(result.current.isLoading).toBe(false)
  })

  it('should use default error message when none provided', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    
    const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'))
    
    await act(async () => {
      try {
        await result.current.execute(mockOperation)
      } catch (error) {
        // Ignore error for this test
      }
    })
    
    expect(result.current.error).toBe('An error occurred')
  })

  it('should handle operations without options', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>())
    
    const mockOperation = vi.fn().mockResolvedValue('success')
    
    let executeResult: string | undefined
    
    await act(async () => {
      executeResult = await result.current.execute(mockOperation)
    })
    
    expect(mockOperation).toHaveBeenCalledTimes(1)
    expect(executeResult).toBe('success')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should clear error when starting new operation', async () => {
    const { result } = renderHook(() => useAsyncOperation())
    
    // First operation that fails
    const failingOperation = vi.fn().mockRejectedValue(new Error('Failed'))
    
    await act(async () => {
      try {
        await result.current.execute(failingOperation)
      } catch (error) {
        // Ignore error
      }
    })
    
    expect(result.current.error).toBe('An error occurred')
    
    // Second operation that succeeds
    const successOperation = vi.fn().mockResolvedValue('success')
    
    await act(async () => {
      await result.current.execute(successOperation)
    })
    
    expect(result.current.error).toBe(null)
  })

  it('should handle synchronous operations', async () => {
    const { result } = renderHook(() => useAsyncOperation<string>())
    
    const syncOperation = vi.fn(() => 'sync result')
    
    let executeResult: string | undefined
    
    await act(async () => {
      executeResult = await result.current.execute(async () => syncOperation())
    })
    
    expect(syncOperation).toHaveBeenCalledTimes(1)
    expect(executeResult).toBe('sync result')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })
})