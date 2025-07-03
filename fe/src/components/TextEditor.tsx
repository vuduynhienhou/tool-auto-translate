import React, { useState, useCallback } from 'react';
import { TextBox } from '../types';
import { Bold, Italic, Palette, Type, Move, Square } from 'lucide-react';

interface TextEditorProps {
  textBox: TextBox;
  onUpdate: (updates: Partial<TextBox>) => void;
  onDelete: () => void;
  isSelected: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({ textBox, onUpdate, onDelete, isSelected }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorType, setColorType] = useState<'text' | 'background'>('text');

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ text: e.target.value });
  }, [onUpdate]);

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ fontSize: parseInt(e.target.value) });
  }, [onUpdate]);

  const toggleFontWeight = useCallback(() => {
    onUpdate({ fontWeight: textBox.fontWeight === 'bold' ? 'normal' : 'bold' });
  }, [textBox.fontWeight, onUpdate]);

  const toggleFontStyle = useCallback(() => {
    onUpdate({ fontStyle: textBox.fontStyle === 'italic' ? 'normal' : 'italic' });
  }, [textBox.fontStyle, onUpdate]);

  const handleColorChange = useCallback((color: string) => {
    if (colorType === 'text') {
      onUpdate({ color });
    } else {
      onUpdate({ backgroundColor: color });
    }
    setShowColorPicker(false);
  }, [colorType, onUpdate]);

  const colorPresets = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#800000'
  ];

  if (!isSelected) {
    return (
      <div
        className="absolute border-2 border-transparent hover:border-blue-300 cursor-pointer group"
        style={{
          left: `${textBox.x * 100}%`,
          top: `${textBox.y * 100}%`,
          width: `${textBox.width * 100}%`,
          height: `${textBox.height * 100}%`,
        }}
      >
        <div
          className="w-full h-full flex items-center justify-center text-center p-1"
          style={{
            fontSize: `${textBox.fontSize}px`,
            fontWeight: textBox.fontWeight,
            fontStyle: textBox.fontStyle,
            color: textBox.color,
            backgroundColor: textBox.backgroundColor,
          }}
        >
          {textBox.text}
        </div>
        <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {Math.round(textBox.confidence * 100)}%
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Text Box</h3>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-500"
          >
            Delete
          </button>
        </div>

        <div className="space-y-4">
          {/* Original Text */}
          <div>
            <label className="block text-sm font-medium mb-1">Original Text</label>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {textBox.originalText}
            </p>
          </div>

          {/* Translated Text */}
          <div>
            <label className="block text-sm font-medium mb-1">Translated Text</label>
            <textarea
              value={textBox.text}
              onChange={handleTextChange}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter translation..."
            />
          </div>

          {/* Font Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Font Size</label>
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4" />
                <input
                  type="range"
                  min="10"
                  max="32"
                  value={textBox.fontSize}
                  onChange={handleFontSizeChange}
                  className="flex-1"
                />
                <span className="text-sm w-8">{textBox.fontSize}px</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Style</label>
              <div className="flex space-x-2">
                <button
                  onClick={toggleFontWeight}
                  className={`p-2 rounded ${
                    textBox.fontWeight === 'bold'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFontStyle}
                  className={`p-2 rounded ${
                    textBox.fontStyle === 'italic'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Color Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Text Color</label>
              <button
                onClick={() => {
                  setColorType('text');
                  setShowColorPicker(true);
                }}
                className="flex items-center space-x-2 p-2 border border-gray-300 rounded w-full hover:bg-gray-50"
              >
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: textBox.color }}
                />
                <span>{textBox.color}</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <button
                onClick={() => {
                  setColorType('background');
                  setShowColorPicker(true);
                }}
                className="flex items-center space-x-2 p-2 border border-gray-300 rounded w-full hover:bg-gray-50"
              >
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: textBox.backgroundColor }}
                />
                <span>{textBox.backgroundColor}</span>
              </button>
            </div>
          </div>

          {/* Confidence Score */}
          <div>
            <label className="block text-sm font-medium mb-1">Translation Confidence</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${textBox.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(textBox.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium mb-1">Preview</label>
            <div
              className="border border-gray-300 rounded p-4 min-h-[60px] flex items-center justify-center text-center"
              style={{
                fontSize: `${textBox.fontSize}px`,
                fontWeight: textBox.fontWeight,
                fontStyle: textBox.fontStyle,
                color: textBox.color,
                backgroundColor: textBox.backgroundColor,
              }}
            >
              {textBox.text || 'Preview will appear here...'}
            </div>
          </div>
        </div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium mb-3">
              Choose {colorType === 'text' ? 'Text' : 'Background'} Color
            </h4>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-400"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <input
                type="color"
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-20 h-10 rounded border"
              />
              <button
                onClick={() => setShowColorPicker(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditor;