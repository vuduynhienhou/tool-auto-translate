// Processing Worker for handling heavy OCR and translation tasks
import { createWorker } from 'tesseract.js';

export interface WorkerMessage {
  id: string;
  type: 'OCR_DETECT' | 'TRANSLATE_TEXT' | 'PROCESS_IMAGE';
  payload: any;
}

export interface WorkerResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS';
  payload: any;
  error?: string;
}

class ProcessingWorker {
  private ocrWorker: any = null;
  private isInitialized = false;

  async initialize(languages: string = 'eng+jpn+chi_sim+chi_tra+kor'): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.ocrWorker = await createWorker(languages);
      this.isInitialized = true;
      console.log('Worker initialized with languages:', languages);
    } catch (error) {
      console.error('Worker initialization failed:', error);
      throw error;
    }
  }

  async processOCR(imageUrl: string, language: string = 'jpn'): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { data } = await this.ocrWorker.recognize(imageUrl);
      
      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words.map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })),
        lines: data.lines.map((line: any) => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox
        }))
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw error;
    }
  }

  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    // Mock translation for worker - in production, this would call translation APIs
    // through fetch requests that work in web workers
    
    const mockTranslations: Record<string, string> = {
      'こんにちは': 'Hello',
      'ありがとう': 'Thank you',
      '元気ですか': 'How are you',
      'はい': 'Yes',
      'いいえ': 'No',
      'すみません': 'Excuse me',
      'さようなら': 'Goodbye',
      'おはよう': 'Good morning',
      'こんばんは': 'Good evening',
      'お疲れ様': 'Good work'
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    return mockTranslations[text] || `[Translated: ${text}]`;
  }

  async processImage(imageData: ImageData, operation: string): Promise<any> {
    // Image processing operations that can be done in worker
    switch (operation) {
      case 'grayscale':
        return this.convertToGrayscale(imageData);
      case 'threshold':
        return this.applyThreshold(imageData);
      case 'blur':
        return this.applyBlur(imageData);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private convertToGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      // Alpha remains unchanged
    }
    
    return imageData;
  }

  private applyThreshold(imageData: ImageData, threshold: number = 128): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const binary = gray > threshold ? 255 : 0;
      
      data[i] = binary;     // Red
      data[i + 1] = binary; // Green
      data[i + 2] = binary; // Blue
      // Alpha remains unchanged
    }
    
    return imageData;
  }

  private applyBlur(imageData: ImageData): ImageData {
    // Simple box blur implementation
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);
    
    const kernel = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ];
    const kernelWeight = 9;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            r += data[idx] * kernel[ky + 1][kx + 1];
            g += data[idx + 1] * kernel[ky + 1][kx + 1];
            b += data[idx + 2] * kernel[ky + 1][kx + 1];
          }
        }
        
        const idx = (y * width + x) * 4;
        output[idx] = r / kernelWeight;
        output[idx + 1] = g / kernelWeight;
        output[idx + 2] = b / kernelWeight;
      }
    }
    
    return new ImageData(output, width, height);
  }

  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
      this.isInitialized = false;
    }
  }
}

// Worker instance
const processingWorker = new ProcessingWorker();

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'OCR_DETECT':
        result = await processingWorker.processOCR(payload.imageUrl, payload.language);
        break;
        
      case 'TRANSLATE_TEXT':
        result = await processingWorker.translateText(
          payload.text,
          payload.fromLang,
          payload.toLang
        );
        break;
        
      case 'PROCESS_IMAGE':
        result = await processingWorker.processImage(payload.imageData, payload.operation);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    const response: WorkerResponse = {
      id,
      type: 'SUCCESS',
      payload: result
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type: 'ERROR',
      payload: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    self.postMessage(response);
  }
});

// Handle worker termination
self.addEventListener('beforeunload', () => {
  processingWorker.cleanup();
});

export default processingWorker;