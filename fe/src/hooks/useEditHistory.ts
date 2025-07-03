import { useState, useCallback } from 'react';
import { EditAction } from '../types';

export const useEditHistory = (maxHistory: number = 50) => {
  const [history, setHistory] = useState<EditAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addAction = useCallback((action: EditAction) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(action);
      
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        setCurrentIndex(prev => prev - 1);
      }
      
      return newHistory;
    });
    setCurrentIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex >= 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    history,
    currentIndex,
    addAction,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  };
};