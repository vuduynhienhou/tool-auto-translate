import { useState, useCallback } from 'react';

export interface DragAndDropOptions {
  validateFiles?: (files: File[]) => File[];
  multiple?: boolean;
  maxFiles?: number;
}

export function useDragAndDrop(
  onDrop: (files: File[]) => void,
  options?: DragAndDropOptions
) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      // Only set inactive if leaving the drag area completely
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragActive(false);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    let files = Array.from(e.dataTransfer.files);
    
    // Apply file count limit
    if (options?.maxFiles && files.length > options.maxFiles) {
      files = files.slice(0, options.maxFiles);
    }
    
    // Apply custom validation
    const validFiles = options?.validateFiles ? options.validateFiles(files) : files;
    
    if (validFiles.length > 0) {
      onDrop(validFiles);
    }
  }, [onDrop, options]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      let fileArray = Array.from(files);
      
      // Apply file count limit
      if (options?.maxFiles && fileArray.length > options.maxFiles) {
        fileArray = fileArray.slice(0, options.maxFiles);
      }
      
      // Apply custom validation
      const validFiles = options?.validateFiles ? options.validateFiles(fileArray) : fileArray;
      
      if (validFiles.length > 0) {
        onDrop(validFiles);
      }
    }
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onDrop, options]);

  return {
    dragActive,
    dragProps: {
      onDragEnter: handleDrag,
      onDragLeave: handleDrag,
      onDragOver: handleDrag,
      onDrop: handleDrop,
    },
    inputProps: {
      onChange: handleFileInput,
      multiple: options?.multiple ?? true,
    },
  };
}