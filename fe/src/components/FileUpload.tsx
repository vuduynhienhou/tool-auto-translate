import React, { useCallback, useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';
import { validateImageFile } from '../utils/imageProcessing';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(validateImageFile);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(validateImageFile);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
    }
  }, [selectedFiles, onFilesSelected]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <Upload className="w-12 h-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-700">
              Drop manga images here or click to select
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports JPG, PNG, WEBP up to 10MB each
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="file-upload"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            Select Images
          </label>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Selected Files ({selectedFiles.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <FileImage className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isProcessing ? 'Processing...' : 'Process Images'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;