import { useState, useCallback } from 'react';
import { useToast } from './useToast';

export interface AsyncOperationOptions<T> {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

export function useAsyncOperation<T = any>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: AsyncOperationOptions<T>
  ): Promise<T | undefined> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await operation();
      
      if (options?.successMessage) {
        toast({ 
          title: 'Success', 
          description: options.successMessage 
        });
      }
      
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = options?.errorMessage || 'An error occurred';
      const errorObj = err as Error;
      
      setError(errorMessage);
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      
      options?.onError?.(errorObj);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return { 
    execute, 
    isLoading, 
    error,
    reset
  };
}