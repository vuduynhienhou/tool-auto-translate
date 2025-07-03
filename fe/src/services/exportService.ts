import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { MangaPage, TranslationProject } from '@/types';
import { imageProcessingService } from './imageProcessing';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'pdf';
  quality: number;
  includeOriginal: boolean;
  includeMetadata: boolean;
  zipName?: string;
}

export interface ExportProgress {
  current: number;
  total: number;
  status: string;
  page?: string;
}

export class ExportService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async exportProject(
    project: TranslationProject,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    const zip = new JSZip();
    const total = project.pages.length + (options.includeOriginal ? project.pages.length : 0);
    let current = 0;

    // Create folders
    const translatedFolder = zip.folder('translated');
    const originalFolder = options.includeOriginal ? zip.folder('original') : null;
    const metadataFolder = options.includeMetadata ? zip.folder('metadata') : null;

    // Export translated pages
    for (const page of project.pages) {
      onProgress?.({
        current: ++current,
        total,
        status: 'Processing translated page',
        page: page.name
      });

      const translatedImageBlob = await this.renderTranslatedPage(page, options);
      const filename = `${page.name}.${options.format}`;
      
      translatedFolder!.file(filename, translatedImageBlob);

      // Export original if requested
      if (options.includeOriginal && originalFolder) {
        onProgress?.({
          current: ++current,
          total,
          status: 'Processing original page',
          page: page.name
        });

        const originalBlob = await this.getOriginalImageBlob(page);
        originalFolder.file(filename, originalBlob);
      }

      // Export metadata if requested
      if (options.includeMetadata && metadataFolder) {
        const metadata = this.createPageMetadata(page);
        metadataFolder.file(`${page.name}.json`, JSON.stringify(metadata, null, 2));
      }
    }

    // Add project metadata
    if (options.includeMetadata) {
      const projectMetadata = this.createProjectMetadata(project);
      zip.file('project.json', JSON.stringify(projectMetadata, null, 2));
    }

    // Generate and download zip
    onProgress?.({
      current: total,
      total,
      status: 'Generating download'
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipName = options.zipName || `${project.name}.zip`;
    
    saveAs(zipBlob, zipName);
  }

  async exportSinglePage(
    page: MangaPage,
    options: Omit<ExportOptions, 'zipName'>
  ): Promise<void> {
    const blob = await this.renderTranslatedPage(page, options);
    const filename = `${page.name}.${options.format}`;
    
    saveAs(blob, filename);
  }

  private async renderTranslatedPage(
    page: MangaPage,
    options: ExportOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          // Set canvas size
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          
          // Clear canvas
          this.ctx.clearRect(0, 0, img.width, img.height);
          
          // Draw original image
          this.ctx.drawImage(img, 0, 0);
          
          // Render translated text boxes
          await this.renderTextBoxes(page.textBoxes);
          
          // Convert to blob
          this.canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            `image/${options.format}`,
            options.quality
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = page.imageUrl;
    });
  }

  private async renderTextBoxes(textBoxes: any[]): Promise<void> {
    for (const textBox of textBoxes) {
      await this.renderTextBox(textBox);
    }
  }

  private async renderTextBox(textBox: any): Promise<void> {
    const { x, y, width, height, text, fontSize, fontWeight, fontStyle, color, backgroundColor } = textBox;

    // Clear the text area with background color
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(x, y, width, height);

    // Set text properties
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${this.getFontFamily(text)}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Enable text smoothing
    this.ctx.textRenderingOptimization = 'optimizeQuality';

    // Handle text wrapping
    const lines = this.wrapText(text, width - 10);
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    const startY = y + (height - totalTextHeight) / 2 + lineHeight / 2;

    // Draw text with outline for better readability
    this.ctx.strokeStyle = this.getOutlineColor(color);
    this.ctx.lineWidth = 2;

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;
      const centerX = x + width / 2;
      
      // Draw outline
      this.ctx.strokeText(line, centerX, lineY);
      
      // Draw fill
      this.ctx.fillText(line, centerX, lineY);
    });
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private getFontFamily(text: string): string {
    const hasAsianCharacters = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(text);
    
    if (hasAsianCharacters) {
      return 'Noto Sans CJK JP, Yu Gothic, Hiragino Kaku Gothic ProN, Meiryo, sans-serif';
    }
    
    return 'Arial, Helvetica, sans-serif';
  }

  private getOutlineColor(fillColor: string): string {
    // Create contrasting outline color
    const isLight = this.isLightColor(fillColor);
    return isLight ? '#000000' : '#FFFFFF';
  }

  private isLightColor(color: string): boolean {
    // Convert hex to RGB if needed
    let r, g, b;
    
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (match) {
        [r, g, b] = match.map(Number);
      } else {
        return false;
      }
    } else {
      return false;
    }

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }

  private async getOriginalImageBlob(page: MangaPage): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        
        this.canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create original image blob'));
            }
          },
          'image/png'
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load original image'));
      img.src = page.imageUrl;
    });
  }

  private createPageMetadata(page: MangaPage): any {
    return {
      id: page.id,
      name: page.name,
      status: page.status,
      textBoxes: page.textBoxes.map(tb => ({
        id: tb.id,
        originalText: tb.originalText,
        translatedText: tb.text,
        position: { x: tb.x, y: tb.y, width: tb.width, height: tb.height },
        confidence: tb.confidence,
        sourceLanguage: tb.sourceLanguage,
        targetLanguage: tb.targetLanguage
      })),
      totalTextBoxes: page.textBoxes.length,
      processingDate: new Date().toISOString()
    };
  }

  private createProjectMetadata(project: TranslationProject): any {
    return {
      id: project.id,
      name: project.name,
      sourceLanguage: project.sourceLanguage,
      targetLanguage: project.targetLanguage,
      createdAt: new Date(project.createdAt).toISOString(),
      lastModified: new Date(project.lastModified).toISOString(),
      totalPages: project.pages.length,
      completedPages: project.pages.filter(p => p.status === 'completed').length,
      totalTextBoxes: project.pages.reduce((sum, page) => sum + page.textBoxes.length, 0),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  async exportToPDF(
    project: TranslationProject,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    // For PDF export, we would need to integrate with a PDF library like jsPDF
    // This is a placeholder implementation
    console.warn('PDF export not yet implemented');
    
    // For now, export as images in a zip
    await this.exportProject(project, { ...options, format: 'png' }, onProgress);
  }

  dispose(): void {
    this.canvas.remove();
  }
}

export const exportService = new ExportService();