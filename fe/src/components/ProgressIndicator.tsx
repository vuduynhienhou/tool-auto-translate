import React from 'react';
import { UploadProgress } from '../types';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: UploadProgress[];
  onClose: () => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, onClose }) => {
  const allComplete = progress.every(p => p.status === 'complete');
  const hasError = progress.some(p => p.status === 'error');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Processing Images</h3>
          {allComplete && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {progress.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {item.status === 'complete' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {item.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {(item.status === 'uploading' || item.status === 'processing') && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{item.file}</span>
                  <span className="text-xs text-gray-500">
                    {item.progress}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      item.status === 'complete' ? 'bg-green-500' :
                      item.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                
                {item.message && (
                  <p className="text-xs text-gray-600 mt-1">{item.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {allComplete && (
          <div className="mt-4 text-center">
            <p className="text-green-600 font-medium">All images processed successfully!</p>
          </div>
        )}
        
        {hasError && (
          <div className="mt-4 text-center">
            <p className="text-red-600 font-medium">Some images failed to process</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;