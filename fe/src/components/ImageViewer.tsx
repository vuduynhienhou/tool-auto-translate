import React, { useState, useCallback, useRef } from 'react';
import { MangaPage, TextBox, EditAction } from '../types';
import { ZoomIn, ZoomOut, Eye, EyeOff, Settings } from 'lucide-react';
import { SettingsDialog } from './SettingsPanel';
import { Button } from './ui/button';

interface ImageViewerProps {
  pages: MangaPage[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  onTextBoxSelect: (pageId: string, textBoxId: string) => void;
  onTextBoxUpdate: (pageId: string, textBoxId: string, updates: Partial<TextBox>) => void;
  selectedTextBox: { pageId: string; textBoxId: string } | null;
  onAddAction: (action: EditAction) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  pages,
  currentPageIndex,
  onPageChange,
  onTextBoxSelect,
  onTextBoxUpdate,
  selectedTextBox,
  onAddAction,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [draggedTextBox, setDraggedTextBox] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[currentPageIndex];

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleTextBoxMouseDown = useCallback((e: React.MouseEvent, textBoxId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDraggedTextBox(textBoxId);
    setDragStart({ x: e.clientX, y: e.clientY });
    onTextBoxSelect(currentPage.id, textBoxId);
  }, [currentPage.id, onTextBoxSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedTextBox || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStart.x) / (rect.width * zoom);
    const deltaY = (e.clientY - dragStart.y) / (rect.height * zoom);

    const textBox = currentPage.textBoxes.find(tb => tb.id === draggedTextBox);
    if (textBox) {
      const newX = Math.max(0, Math.min(1 - textBox.width, textBox.x + deltaX));
      const newY = Math.max(0, Math.min(1 - textBox.height, textBox.y + deltaY));

      onTextBoxUpdate(currentPage.id, draggedTextBox, { x: newX, y: newY });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [draggedTextBox, dragStart, currentPage, zoom, onTextBoxUpdate]);

  const handleMouseUp = useCallback(() => {
    if (draggedTextBox) {
      const textBox = currentPage.textBoxes.find(tb => tb.id === draggedTextBox);
      if (textBox) {
        onAddAction({
          id: `action-${Date.now()}`,
          type: 'move',
          pageId: currentPage.id,
          textBoxId: draggedTextBox,
          before: { x: textBox.x, y: textBox.y },
          after: { x: textBox.x, y: textBox.y },
          timestamp: Date.now(),
          description: `Moved text box to new position`,
        });
      }
    }
    setDraggedTextBox(null);
  }, [draggedTextBox, currentPage, onAddAction]);

  const handleTextBoxClick = useCallback((e: React.MouseEvent, textBoxId: string) => {
    e.stopPropagation();
    onTextBoxSelect(currentPage.id, textBoxId);
  }, [currentPage.id, onTextBoxSelect]);

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No pages loaded</p>
      </div>
    );
  }

  const textBoxesToShow = showOriginal ? currentPage.originalTextBoxes : currentPage.textBoxes;

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium">{currentPage.name}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`flex items-center space-x-2 px-3 py-2 rounded ${
              showOriginal
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showOriginal ? 'Hide Original' : 'Show Original'}</span>
          </button>

          <SettingsDialog>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </SettingsDialog>

          <div className="flex items-center space-x-2">
            <span className="text-sm">Page:</span>
            <select
              value={currentPageIndex}
              onChange={(e) => onPageChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded"
            >
              {pages.map((page, index) => (
                <option key={page.id} value={index}>
                  {index + 1} - {page.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative inline-block"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={currentPage.imageUrl}
              alt={currentPage.name}
              className="max-w-full h-auto block"
              draggable={false}
            />

            {/* Text Boxes */}
            {textBoxesToShow.map((textBox) => (
              <div
                key={textBox.id}
                className={`absolute cursor-pointer border-2 transition-all duration-200 ${
                  selectedTextBox?.textBoxId === textBox.id
                    ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                    : 'border-transparent hover:border-blue-300 hover:bg-blue-300 hover:bg-opacity-10'
                }`}
                style={{
                  left: `${textBox.x * 100}%`,
                  top: `${textBox.y * 100}%`,
                  width: `${textBox.width * 100}%`,
                  height: `${textBox.height * 100}%`,
                }}
                onMouseDown={(e) => handleTextBoxMouseDown(e, textBox.id)}
                onClick={(e) => handleTextBoxClick(e, textBox.id)}
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

                {/* Confidence Badge */}
                <div className="absolute -top-6 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                  {Math.round(textBox.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      {pages.length > 1 && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex justify-center space-x-2">
            {pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => onPageChange(index)}
                className={`w-12 h-12 rounded border-2 overflow-hidden ${
                  index === currentPageIndex
                    ? 'border-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={page.imageUrl}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;