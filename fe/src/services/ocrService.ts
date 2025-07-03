import { createWorker, Worker } from 'tesseract.js';
import { TextBox } from '@/types';
import { generateId } from '@/lib/utils';

interface OCRWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface OCRLine {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  words: OCRWord[];
}

interface OCRResult {
  data: {
    text: string;
    confidence: number;
    lines: OCRLine[];
  };
}

export class OCRService {
  private worker: Worker | null = null;
  private isInitialized = false;

  async initialize(language: string = 'eng+jpn+chi_sim+chi_tra+kor'): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker(language);
      this.isInitialized = true;
      console.log('OCR Service initialized with languages:', language);
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      throw new Error('OCR initialization failed');
    }
  }

  async detectText(imageUrl: string, sourceLanguage: string = 'jpn'): Promise<TextBox[]> {
    if (!this.worker || !this.isInitialized) {
      await this.initialize();
    }

    try {
      const { data } = await this.worker!.recognize(imageUrl) as OCRResult;
      return this.processOCRResult(data, sourceLanguage);
    } catch (error) {
      console.error('OCR detection failed:', error);
      throw new Error('Text detection failed');
    }
  }

  private processOCRResult(ocrData: OCRResult['data'], sourceLanguage: string): TextBox[] {
    const textBoxes: TextBox[] = [];
    
    // Group words into logical text blocks
    const lines = ocrData.lines.filter(line => 
      line.confidence > 30 && 
      line.text.trim().length > 0
    );

    lines.forEach(line => {
      // Calculate relative coordinates (0-1 scale)
      const bbox = line.bbox;
      const width = bbox.x1 - bbox.x0;
      const height = bbox.y1 - bbox.y0;
      
      // Skip very small or very large boxes (likely noise)
      if (width < 10 || height < 10 || width > 1000 || height > 1000) {
        return;
      }

      const textBox: TextBox = {
        id: generateId(),
        x: bbox.x0,
        y: bbox.y0,
        width,
        height,
        text: line.text.trim(),
        originalText: line.text.trim(),
        fontSize: Math.max(12, Math.min(height * 0.8, 24)),
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        backgroundColor: '#ffffff',
        confidence: line.confidence / 100,
        sourceLanguage,
        targetLanguage: 'en'
      };

      textBoxes.push(textBox);
    });

    return textBoxes;
  }

  async detectLanguage(text: string): Promise<string> {
    // Enhanced language detection
    const patterns = {
      ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
      zh: /[\u4E00-\u9FFF]/,
      ko: /[\uAC00-\uD7AF]/,
      en: /^[a-zA-Z0-9\s.,!?;:'"()-]+$/,
      ar: /[\u0600-\u06FF]/,
      ru: /[\u0400-\u04FF]/,
      hi: /[\u0900-\u097F]/,
      th: /[\u0E00-\u0E7F]/
    };

    // Count matches for each language
    const scores: Record<string, number> = {};
    
    Object.entries(patterns).forEach(([lang, pattern]) => {
      const matches = text.match(new RegExp(pattern.source, 'g'));
      scores[lang] = matches ? matches.length : 0;
    });

    // Find the language with the highest score
    const detectedLang = Object.entries(scores)
      .reduce((best, [lang, score]) => 
        score > best.score ? { lang, score } : best, 
        { lang: 'en', score: 0 }
      );

    return detectedLang.lang;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const ocrService = new OCRService();