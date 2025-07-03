import React from 'react';
import { EditAction } from '../types';
import { Undo, Redo, RotateCcw, Clock } from 'lucide-react';

interface HistoryPanelProps {
  history: EditAction[];
  currentIndex: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearHistory: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearHistory,
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActionDescription = (action: EditAction) => {
    switch (action.type) {
      case 'move':
        return 'Moved text box';
      case 'resize':
        return 'Resized text box';
      case 'edit':
        return 'Edited text';
      case 'add':
        return 'Added text box';
      case 'delete':
        return 'Deleted text box';
      default:
        return 'Unknown action';
    }
  };

  return (
    <div className="w-64 h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Edit History</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="w-4 h-4" />
            <span>Undo</span>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo className="w-4 h-4" />
            <span>Redo</span>
          </button>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="mt-2 w-full flex items-center justify-center space-x-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No actions yet</p>
          </div>
        ) : (
          <div className="p-2">
            {history.map((action, index) => (
              <div
                key={action.id}
                className={`p-3 mb-2 rounded-lg border ${
                  index <= currentIndex
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium">
                    {getActionDescription(action)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(action.timestamp)}
                  </span>
                </div>
                
                {action.type === 'edit' && (
                  <div className="text-xs text-gray-600 mt-1">
                    <div className="truncate">
                      Before: "{action.before.text}"
                    </div>
                    <div className="truncate">
                      After: "{action.after.text}"
                    </div>
                  </div>
                )}
                
                {(action.type === 'move' || action.type === 'resize') && (
                  <div className="text-xs text-gray-600 mt-1">
                    Position: ({Math.round((action.after.x || 0) * 100)}%, {Math.round((action.after.y || 0) * 100)}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;