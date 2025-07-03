import { TextBox } from '@/types';

export interface ImageProcessingOptions {
  compressionQuality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface FontMatchingResult {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: string;
  backgroundColor: string;
}

export class ImageProcessingService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fontCache: Map<string, FontFace> = new Map();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  async optimizeImage(
    imageFile: File,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<Blob> {
    const defaultOptions: ImageProcessingOptions = {
      compressionQuality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'jpeg'
    };

    const opts = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const blob = this.processImageOptimization(img, opts);
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  }

  private processImageOptimization(
    img: HTMLImageElement,
    options: ImageProcessingOptions
  ): Blob {
    // Calculate new dimensions maintaining aspect ratio
    const { width, height } = this.calculateOptimalDimensions(
      img.width,
      img.height,
      options.maxWidth,
      options.maxHeight
    );

    this.canvas.width = width;
    this.canvas.height = height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw optimized image
    this.ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    return new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        `image/${options.format}`,
        options.compressionQuality
      );
    }) as any;
  }

  private calculateOptimalDimensions(
    currentWidth: number,
    currentHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: currentWidth, height: currentHeight };

    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  async analyzeTextStyle(
    imageUrl: string,
    textBox: TextBox
  ): Promise<FontMatchingResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const result = this.extractTextStyle(img, textBox);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  private extractTextStyle(img: HTMLImageElement, textBox: TextBox): FontMatchingResult {
    // Set up canvas for analysis
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);

    // Extract the text region
    const textRegion = this.ctx.getImageData(
      textBox.x,
      textBox.y,
      textBox.width,
      textBox.height
    );

    // Analyze colors
    const { dominantColor, backgroundColor } = this.analyzeColors(textRegion);

    // Estimate font properties
    const fontSize = this.estimateFontSize(textBox);
    const fontFamily = this.matchFontFamily(textBox.text, fontSize);
    const fontWeight = this.estimateFontWeight(textRegion);
    const fontStyle = this.estimateFontStyle(textRegion);

    return {
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      color: dominantColor,
      backgroundColor
    };
  }

  private analyzeColors(imageData: ImageData): { dominantColor: string; backgroundColor: string } {
    const data = imageData.data;
    const colorCounts: Map<string, number> = new Map();
    const brightnessCounts: Map<string, number> = new Map();

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue; // Skip transparent pixels

      const color = `rgb(${r},${g},${b})`;
      const brightness = (r + g + b) / 3;

      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      brightnessCounts.set(brightness < 128 ? 'dark' : 'light', 
        (brightnessCounts.get(brightness < 128 ? 'dark' : 'light') || 0) + 1);
    }

    // Find dominant color
    let dominantColor = '#000000';
    let maxCount = 0;
    for (const [color, count] of colorCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = color;
      }
    }

    // Determine background color (opposite of dominant)
    const isDarkText = (brightnessCounts.get('dark') || 0) > (brightnessCounts.get('light') || 0);
    const backgroundColor = isDarkText ? '#ffffff' : '#000000';

    return { dominantColor, backgroundColor };
  }

  private estimateFontSize(textBox: TextBox): number {
    // Estimate font size based on text box height and character count
    const avgCharWidth = textBox.width / Math.max(textBox.text.length, 1);
    const estimatedSize = Math.min(textBox.height * 0.8, avgCharWidth * 1.2);
    
    // Clamp to reasonable values
    return Math.max(10, Math.min(72, Math.round(estimatedSize)));
  }

  private matchFontFamily(text: string, fontSize: number): string {
    // Font matching logic based on text characteristics
    const hasAsianCharacters = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(text);
    
    if (hasAsianCharacters) {
      return 'Noto Sans CJK, Arial Unicode MS, sans-serif';
    }
    
    // For western text, use common web fonts
    const commonFonts = [
      'Arial, sans-serif',
      'Helvetica, sans-serif',
      'Times New Roman, serif',
      'Georgia, serif',
      'Courier New, monospace'
    ];
    
    // Simple heuristic: larger text likely uses sans-serif
    return fontSize > 16 ? commonFonts[0] : commonFonts[2];
  }

  private estimateFontWeight(imageData: ImageData): string {
    // Analyze stroke width by looking at edge density
    const data = imageData.data;
    let edgeCount = 0;
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      if (brightness < 128) { // Dark pixels
        totalPixels++;
      }
    }

    // More dark pixels relative to area suggests bold text
    const darkPixelRatio = totalPixels / (data.length / 4);
    return darkPixelRatio > 0.4 ? 'bold' : 'normal';
  }

  private estimateFontStyle(imageData: ImageData): string {
    // Simple heuristic - in reality, this would need more sophisticated analysis
    return 'normal';
  }

  async compositeImage(
    originalImageUrl: string,
    textBoxes: TextBox[]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          const result = await this.renderCompositeImage(img, textBoxes);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = originalImageUrl;
    });
  }

  private async renderCompositeImage(
    img: HTMLImageElement,
    textBoxes: TextBox[]
  ): Promise<string> {
    this.canvas.width = img.width;
    this.canvas.height = img.height;

    // Draw original image
    this.ctx.drawImage(img, 0, 0);

    // Render each text box
    for (const textBox of textBoxes) {
      await this.renderTextBox(textBox);
    }

    return this.canvas.toDataURL('image/png');
  }

  private async renderTextBox(textBox: TextBox): Promise<void> {
    const { x, y, width, height, text, fontSize, fontWeight, fontStyle, color, backgroundColor } = textBox;

    // Clear the text region
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(x, y, width, height);

    // Set text properties
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${this.getFontFamily(text)}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Handle text wrapping
    const lines = this.wrapText(text, width - 10); // 10px padding
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = y + (height - totalHeight) / 2 + lineHeight / 2;

    // Draw each line
    lines.forEach((line, index) => {
      this.ctx.fillText(
        line,
        x + width / 2,
        startY + index * lineHeight
      );
    });
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private getFontFamily(text: string): string {
    const hasAsianCharacters = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(text);
    return hasAsianCharacters 
      ? 'Noto Sans CJK, Arial Unicode MS, sans-serif'
      : 'Arial, sans-serif';
  }

  async createThumbnail(imageUrl: string, maxSize: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const { width, height } = this.calculateOptimalDimensions(
            img.width,
            img.height,
            maxSize,
            maxSize
          );

          this.canvas.width = width;
          this.canvas.height = height;
          this.ctx.drawImage(img, 0, 0, width, height);

          resolve(this.canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  dispose(): void {
    this.canvas.remove();
    this.fontCache.clear();
  }
}

export const imageProcessingService = new ImageProcessingService();