import React, { useState } from 'react';
import { MangaPage } from '../types';
import { Download, FileArchive, Save, Settings } from 'lucide-react';
import { downloadZip } from '../utils/imageProcessing';

interface ExportPanelProps {
  pages: MangaPage[];
  projectName: string;
  onSaveProject: () => void;
  onClose: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  pages,
  projectName,
  onSaveProject,
  onClose,
}) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png');
  const [quality, setQuality] = useState(90);
  const [includeOriginal, setIncludeOriginal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSingle = async (page: MangaPage) => {
    setIsExporting(true);
    try {
      // In a real implementation, this would render the page with text overlays
      // For now, we'll simulate the export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const link = document.createElement('a');
      link.download = `${page.name}.${exportFormat}`;
      link.href = page.imageUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await downloadZip(pages, projectName);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Export Options</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Settings */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Export Settings
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpg')}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="png">PNG (Lossless)</option>
                  <option value="jpg">JPG (Smaller file)</option>
                </select>
              </div>

              {exportFormat === 'jpg' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Quality</label>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600">{quality}%</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeOriginal}
                  onChange={(e) => setIncludeOriginal(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include original images</span>
              </label>
            </div>
          </div>

          {/* Save Project */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium">Save Project</h4>
              <p className="text-sm text-gray-600">
                Save your work to continue editing later
              </p>
            </div>
            <button
              onClick={onSaveProject}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              <span>Save Project</span>
            </button>
          </div>

          {/* Export All */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h4 className="font-medium">Export All Pages</h4>
              <p className="text-sm text-gray-600">
                Download all {pages.length} pages as a ZIP archive
              </p>
            </div>
            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <FileArchive className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export All'}</span>
            </button>
          </div>

          {/* Individual Pages */}
          <div>
            <h4 className="font-medium mb-3">Export Individual Pages</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={page.imageUrl}
                      alt={page.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-gray-600">
                        {page.textBoxes.length} text boxes
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportSingle(page)}
                    disabled={isExporting}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;