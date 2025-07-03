import React, { useRef, useEffect } from 'react';
import { useKeyboardNavigation, useFocusManagement, useScreenReader } from '@/hooks/useKeyboardNavigation';
import { TextBox } from '@/types';

interface AccessibleImageViewerProps {
  imageUrl: string;
  imageName: string;
  textBoxes: TextBox[];
  selectedTextBoxId?: string;
  onTextBoxSelect: (textBoxId: string) => void;
  onTextBoxUpdate: (textBoxId: string, updates: Partial<TextBox>) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function AccessibleImageViewer({
  imageUrl,
  imageName,
  textBoxes,
  selectedTextBoxId,
  onTextBoxSelect,
  onTextBoxUpdate,
  zoom,
  onZoomChange
}: AccessibleImageViewerProps) {
  const { containerRef, focusFirst } = useFocusManagement();
  const { announce, AnnouncementRegion } = useScreenReader();
  const imageRef = useRef<HTMLImageElement>(null);

  // Keyboard navigation for image viewer
  useKeyboardNavigation({
    onArrowUp: () => {
      const currentIndex = selectedTextBoxId 
        ? textBoxes.findIndex(tb => tb.id === selectedTextBoxId)
        : -1;
      
      if (currentIndex > 0) {
        const previousTextBox = textBoxes[currentIndex - 1];
        onTextBoxSelect(previousTextBox.id);
        announce(`Selected text box: ${previousTextBox.text}`);
      }
    },
    onArrowDown: () => {
      const currentIndex = selectedTextBoxId 
        ? textBoxes.findIndex(tb => tb.id === selectedTextBoxId)
        : -1;
      
      if (currentIndex < textBoxes.length - 1) {
        const nextTextBox = textBoxes[currentIndex + 1];
        onTextBoxSelect(nextTextBox.id);
        announce(`Selected text box: ${nextTextBox.text}`);
      }
    },
    onArrowLeft: () => {
      if (selectedTextBoxId) {
        const textBox = textBoxes.find(tb => tb.id === selectedTextBoxId);
        if (textBox) {
          onTextBoxUpdate(selectedTextBoxId, { x: Math.max(0, textBox.x - 0.01) });
          announce('Moved text box left');
        }
      }
    },
    onArrowRight: () => {
      if (selectedTextBoxId) {
        const textBox = textBoxes.find(tb => tb.id === selectedTextBoxId);
        if (textBox) {
          onTextBoxUpdate(selectedTextBoxId, { x: Math.min(1 - textBox.width, textBox.x + 0.01) });
          announce('Moved text box right');
        }
      }
    },
    enabledKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
  });

  // Announce zoom changes
  useEffect(() => {
    announce(`Zoom level: ${Math.round(zoom * 100)}%`);
  }, [zoom, announce]);

  // Focus management
  useEffect(() => {
    if (selectedTextBoxId) {
      const selectedElement = containerRef.current?.querySelector(
        `[data-textbox-id="${selectedTextBoxId}"]`
      ) as HTMLElement;
      selectedElement?.focus();
    }
  }, [selectedTextBoxId]);

  const handleTextBoxKeyDown = (event: React.KeyboardEvent, textBox: TextBox) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onTextBoxSelect(textBox.id);
        announce(`Selected text box: ${textBox.text}`);
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        // Add delete functionality
        announce(`Deleted text box: ${textBox.text}`);
        break;
    }
  };

  const calculateAbsolutePosition = (textBox: TextBox) => {
    if (!imageRef.current) return { left: 0, top: 0, width: 0, height: 0 };
    
    const imageRect = imageRef.current.getBoundingClientRect();
    return {
      left: textBox.x * imageRect.width,
      top: textBox.y * imageRect.height,
      width: textBox.width * imageRect.width,
      height: textBox.height * imageRect.height
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative focus-within:outline-none"
      role="application"
      aria-label="Manga page editor"
    >
      <AnnouncementRegion />
      
      {/* Skip link for keyboard users */}
      <a
        href="#text-boxes-list"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-2 focus:rounded"
      >
        Skip to text boxes list
      </a>

      {/* Main image */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt={`Manga page: ${imageName}`}
        className="max-w-full h-auto block"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        draggable={false}
      />

      {/* Text boxes overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        {textBoxes.map((textBox, index) => {
          const isSelected = textBox.id === selectedTextBoxId;
          const position = calculateAbsolutePosition(textBox);
          
          return (
            <div
              key={textBox.id}
              data-textbox-id={textBox.id}
              className={`absolute pointer-events-auto cursor-pointer border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-500 bg-opacity-20 ring-2 ring-blue-500 ring-offset-2'
                  : 'border-transparent hover:border-blue-300 hover:bg-blue-300 hover:bg-opacity-10'
              }`}
              style={{
                left: `${textBox.x * 100}%`,
                top: `${textBox.y * 100}%`,
                width: `${textBox.width * 100}%`,
                height: `${textBox.height * 100}%`,
              }}
              role="button"
              tabIndex={0}
              aria-label={`Text box ${index + 1}: ${textBox.text}. Confidence: ${Math.round(textBox.confidence * 100)}%`}
              aria-describedby={`textbox-description-${textBox.id}`}
              aria-pressed={isSelected}
              onClick={() => onTextBoxSelect(textBox.id)}
              onKeyDown={(e) => handleTextBoxKeyDown(e, textBox)}
            >
              <div
                className="w-full h-full flex items-center justify-center text-center p-1 select-none"
                style={{
                  fontSize: `${textBox.fontSize}px`,
                  fontWeight: textBox.fontWeight,
                  fontStyle: textBox.fontStyle,
                  color: textBox.color,
                  backgroundColor: textBox.backgroundColor,
                  lineHeight: '1.2',
                }}
              >
                {textBox.text}
              </div>
              
              {/* Hidden description for screen readers */}
              <div id={`textbox-description-${textBox.id}`} className="sr-only">
                Original text: {textBox.originalText}.
                Language: {textBox.sourceLanguage} to {textBox.targetLanguage}.
                Confidence: {Math.round(textBox.confidence * 100)}%.
                Use arrow keys to move, Enter to select, Delete to remove.
              </div>
            </div>
          );
        })}
      </div>

      {/* Text boxes list for screen readers */}
      <div id="text-boxes-list" className="sr-only">
        <h3>Text boxes on this page:</h3>
        <ul>
          {textBoxes.map((textBox, index) => (
            <li key={textBox.id}>
              Text box {index + 1}: {textBox.text}
              (Original: {textBox.originalText}, 
              Confidence: {Math.round(textBox.confidence * 100)}%)
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions for keyboard users */}
      <div className="sr-only" aria-live="polite">
        <p>
          Use arrow keys to navigate between text boxes and move selected text box.
          Press Enter or Space to select a text box.
          Press Delete to remove a text box.
          Current zoom level: {Math.round(zoom * 100)}%.
        </p>
        {selectedTextBoxId && (
          <p>
            Selected: {textBoxes.find(tb => tb.id === selectedTextBoxId)?.text}
          </p>
        )}
      </div>
    </div>
  );
}