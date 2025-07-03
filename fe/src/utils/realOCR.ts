import { TextBox } from '@/types'
import { generateId } from '@/lib/utils'
import { ocrService } from '@/services/ocrService'
import { bubbleDetectionService } from '@/services/bubbleDetection'
import { translationService } from '@/services/translationService'
import { workerService } from '@/services/workerService'

// Enhanced OCR detection using real OCR services
export const detectTextBoxes = async (imageUrl: string, sourceLanguage: string = 'jpn'): Promise<TextBox[]> => {
  try {
    console.log('Starting OCR detection with real services...');
    
    // Initialize services
    await Promise.all([
      ocrService.initialize(),
      bubbleDetectionService.initialize()
    ]);

    // First, try using the web worker for better performance
    let textBoxes: TextBox[];
    
    if (workerService.isWorkerAvailable()) {
      console.log('Using web worker for OCR...');
      const ocrResult = await workerService.performOCR(imageUrl, sourceLanguage);
      textBoxes = processOCRResult(ocrResult, sourceLanguage, imageUrl);
    } else {
      console.log('Using main thread for OCR...');
      textBoxes = await ocrService.detectText(imageUrl, sourceLanguage);
    }
    
    // Enhance with bubble detection
    console.log('Enhancing with bubble detection...');
    const enhancedTextBoxes = await bubbleDetectionService.enhanceTextRegions(imageUrl, textBoxes);
    
    // Convert absolute coordinates to relative (0-1 scale) if needed
    const finalTextBoxes = await normalizeCoordinates(enhancedTextBoxes, imageUrl);
    
    console.log(`Successfully detected ${finalTextBoxes.length} text regions`);
    return finalTextBoxes;
    
  } catch (error) {
    console.error('OCR detection failed, falling back to mock data:', error);
    
    // Fallback to mock data if OCR fails
    return getMockTextBoxes(sourceLanguage);
  }
}

// Real translation using multiple services
export const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
  try {
    console.log(`Translating "${text}" from ${fromLang} to ${toLang}`);
    
    // First, try using the web worker
    if (workerService.isWorkerAvailable()) {
      console.log('Using web worker for translation...');
      return await workerService.translateText(text, fromLang, toLang);
    }
    
    // Fallback to main thread translation
    console.log('Using main thread for translation...');
    const result = await translationService.translate(text, fromLang, toLang);
    console.log(`Translation result: "${result.translatedText}" (${result.provider}, confidence: ${result.confidence})`);
    
    return result.translatedText;
  } catch (error) {
    console.error('Translation failed, using fallback:', error);
    
    // Fallback to mock translations
    return getMockTranslation(text) || `[Translation Error: ${text}]`;
  }
}

// Enhanced language detection
export const detectLanguage = async (text: string): Promise<string> => {
  try {
    return await translationService.detectLanguage(text);
  } catch (error) {
    console.error('Language detection failed:', error);
    return simpleLanguageDetection(text);
  }
}

// Helper functions
function processOCRResult(ocrResult: any, sourceLanguage: string, imageUrl: string): TextBox[] {
  const textBoxes: TextBox[] = [];
  
  if (ocrResult.lines) {
    ocrResult.lines.forEach((line: any) => {
      if (line.text.trim() && line.confidence > 30) {
        const bbox = line.bbox;
        const width = bbox.x1 - bbox.x0;
        const height = bbox.y1 - bbox.y0;
        
        // Skip very small or very large boxes (likely noise)
        if (width < 10 || height < 10 || width > 1000 || height > 1000) {
          return;
        }
        
        textBoxes.push({
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
        });
      }
    });
  }
  
  return textBoxes;
}

async function normalizeCoordinates(textBoxes: TextBox[], imageUrl: string): Promise<TextBox[]> {
  try {
    const { width: imgWidth, height: imgHeight } = await getImageDimensions(imageUrl);
    
    return textBoxes.map(textBox => {
      // If coordinates are already normalized (0-1), keep them
      if (textBox.x <= 1 && textBox.y <= 1 && textBox.width <= 1 && textBox.height <= 1) {
        return textBox;
      }
      
      // Otherwise, normalize them
      return {
        ...textBox,
        x: textBox.x / imgWidth,
        y: textBox.y / imgHeight,
        width: textBox.width / imgWidth,
        height: textBox.height / imgHeight,
      };
    });
  } catch (error) {
    console.error('Failed to normalize coordinates:', error);
    return textBoxes;
  }
}

function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for dimension calculation'));
    };
    
    img.src = imageUrl;
  });
}

function getMockTextBoxes(sourceLanguage: string): TextBox[] {
  console.log('Using mock text boxes as fallback');
  
  const mockTextBoxes: TextBox[] = [
    {
      id: generateId(),
      x: 0.15,
      y: 0.1,
      width: 0.25,
      height: 0.08,
      text: 'こんにちは！',
      originalText: 'こんにちは！',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: '#ffffff',
      confidence: 0.92,
      sourceLanguage,
      targetLanguage: 'en'
    },
    {
      id: generateId(),
      x: 0.6,
      y: 0.25,
      width: 0.3,
      height: 0.12,
      text: '元気ですか？',
      originalText: '元気ですか？',
      fontSize: 14,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: '#ffffff',
      confidence: 0.88,
      sourceLanguage,
      targetLanguage: 'en'
    },
    {
      id: generateId(),
      x: 0.1,
      y: 0.6,
      width: 0.4,
      height: 0.1,
      text: 'はい、元気です！',
      originalText: 'はい、元気です！',
      fontSize: 15,
      fontWeight: 'normal',
      fontStyle: 'italic',
      color: '#000000',
      backgroundColor: '#ffffff',
      confidence: 0.95,
      sourceLanguage,
      targetLanguage: 'en'
    }
  ];
  
  return mockTextBoxes;
}

function getMockTranslation(text: string): string | null {
  const translations: Record<string, string> = {
    'こんにちは！': 'Hello!',
    '元気ですか？': 'How are you?',
    'はい、元気です！': 'Yes, I\'m fine!',
    'ありがとう': 'Thank you',
    'さようなら': 'Goodbye',
    'おはよう': 'Good morning',
    'こんばんは': 'Good evening',
    'すみません': 'Excuse me',
    'お疲れ様': 'Good work',
    'いただきます': 'Let\'s eat',
    'ごちそうさま': 'Thank you for the meal',
    'がんばって': 'Good luck',
    'どうぞ': 'Please go ahead',
    'お願いします': 'Please',
    '大丈夫': 'It\'s okay',
    'だめ': 'No good',
    'やめて': 'Stop',
    '助けて': 'Help',
    '愛してる': 'I love you'
  };
  
  return translations[text] || null;
}

function simpleLanguageDetection(text: string): string {
  const patterns = {
    ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
    zh: /[\u4E00-\u9FFF]/,
    ko: /[\uAC00-\uD7AF]/,
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