export interface TranslationProvider {
  name: string;
  translate(text: string, from: string, to: string): Promise<string>;
  detectLanguage?(text: string): Promise<string>;
}

export interface TranslationResult {
  translatedText: string;
  provider: string;
  confidence: number;
  detectedLanguage?: string;
}

class GoogleTranslateProvider implements TranslationProvider {
  name = 'Google Translate';
  private apiKey: string;
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: from,
          target: to,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Google Translate error:', error);
      throw new Error('Google Translate failed');
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      });

      if (!response.ok) {
        throw new Error(`Google Translate Detection API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.detections[0][0].language;
    } catch (error) {
      console.error('Google Translate detection error:', error);
      throw new Error('Language detection failed');
    }
  }
}

class DeepLProvider implements TranslationProvider {
  name = 'DeepL';
  private apiKey: string;
  private baseUrl = 'https://api-free.deepl.com/v2/translate';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text,
          source_lang: from.toUpperCase(),
          target_lang: to.toUpperCase()
        })
      });

      if (!response.ok) {
        throw new Error(`DeepL API error: ${response.status}`);
      }

      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      console.error('DeepL error:', error);
      throw new Error('DeepL translation failed');
    }
  }
}

class LibreTranslateProvider implements TranslationProvider {
  name = 'LibreTranslate';
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'https://libretranslate.de/translate', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const body: any = {
        q: text,
        source: from,
        target: to,
        format: 'text'
      };

      if (this.apiKey) {
        body.api_key = this.apiKey;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`LibreTranslate API error: ${response.status}`);
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('LibreTranslate error:', error);
      throw new Error('LibreTranslate failed');
    }
  }
}

// Fallback offline translation for common phrases
class OfflineTranslationProvider implements TranslationProvider {
  name = 'Offline Dictionary';
  
  private translations: Record<string, Record<string, string>> = {
    'ja-en': {
      'こんにちは': 'Hello',
      'こんばんは': 'Good evening',
      'おはよう': 'Good morning',
      'ありがとう': 'Thank you',
      'すみません': 'Excuse me',
      'はい': 'Yes',
      'いいえ': 'No',
      'さようなら': 'Goodbye',
      'お疲れ様': 'Good work',
      'いただきます': 'Thank you for the meal',
      'ごちそうさま': 'Thank you for the meal',
      'がんばって': 'Good luck',
      'どうぞ': 'Please go ahead',
      'お願いします': 'Please',
      '大丈夫': 'It\'s okay',
      'だめ': 'No good',
      'やめて': 'Stop',
      '助けて': 'Help',
      '愛してる': 'I love you',
      '元気': 'Healthy/Fine',
      '幸せ': 'Happy',
      '悲しい': 'Sad',
      '怒る': 'Angry',
      '驚く': 'Surprised',
      '面白い': 'Interesting',
      '美味しい': 'Delicious',
      '綺麗': 'Beautiful',
      '可愛い': 'Cute',
      '格好いい': 'Cool',
      '強い': 'Strong',
      '弱い': 'Weak',
      '速い': 'Fast',
      '遅い': 'Slow',
      '大きい': 'Big',
      '小さい': 'Small'
    }
  };

  async translate(text: string, from: string, to: string): Promise<string> {
    const key = `${from}-${to}`;
    const dict = this.translations[key];
    
    if (!dict) {
      throw new Error(`No offline translation available for ${from} to ${to}`);
    }

    const translation = dict[text.trim()];
    if (!translation) {
      throw new Error(`No translation found for: ${text}`);
    }

    return translation;
  }
}

export class TranslationService {
  private providers: TranslationProvider[] = [];
  private cache: Map<string, TranslationResult> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Always include offline provider as fallback
    this.providers.push(new OfflineTranslationProvider());
  }

  addProvider(provider: TranslationProvider): void {
    this.providers.unshift(provider); // Add to beginning for priority
  }

  setupGoogleTranslate(apiKey: string): void {
    this.addProvider(new GoogleTranslateProvider(apiKey));
  }

  setupDeepL(apiKey: string): void {
    this.addProvider(new DeepLProvider(apiKey));
  }

  setupLibreTranslate(baseUrl?: string, apiKey?: string): void {
    this.addProvider(new LibreTranslateProvider(baseUrl, apiKey));
  }

  async translate(text: string, from: string, to: string): Promise<TranslationResult> {
    const cacheKey = `${from}-${to}-${text}`;
    
    // Check cache first
    if (this.isInCache(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Try providers in order
    for (const provider of this.providers) {
      try {
        const translatedText = await provider.translate(text, from, to);
        
        const result: TranslationResult = {
          translatedText,
          provider: provider.name,
          confidence: this.calculateConfidence(provider.name, translatedText)
        };

        // Cache the result
        this.cache.set(cacheKey, result);
        this.cacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout);

        return result;
      } catch (error) {
        console.warn(`Translation failed with ${provider.name}:`, error);
        continue; // Try next provider
      }
    }

    throw new Error('All translation providers failed');
  }

  async detectLanguage(text: string): Promise<string> {
    // Try providers that support language detection
    for (const provider of this.providers) {
      if (provider.detectLanguage) {
        try {
          return await provider.detectLanguage(text);
        } catch (error) {
          console.warn(`Language detection failed with ${provider.name}:`, error);
          continue;
        }
      }
    }

    // Fallback to simple pattern matching
    return this.simpleLanguageDetection(text);
  }

  private isInCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  private calculateConfidence(providerName: string, translatedText: string): number {
    // Simple confidence calculation based on provider and result
    const providerScores: Record<string, number> = {
      'Google Translate': 0.95,
      'DeepL': 0.92,
      'LibreTranslate': 0.85,
      'Offline Dictionary': 0.99
    };

    const baseScore = providerScores[providerName] || 0.7;
    
    // Adjust based on translation quality indicators
    let adjustment = 0;
    if (translatedText.includes('[')) adjustment -= 0.1; // Likely untranslated
    if (translatedText.length > 0) adjustment += 0.05; // Has content

    return Math.max(0, Math.min(1, baseScore + adjustment));
  }

  private simpleLanguageDetection(text: string): string {
    const patterns = {
      ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
      zh: /[\u4E00-\u9FFF]/,
      ko: /[\uAC00-\uD7AF]/,
      ar: /[\u0600-\u06FF]/,
      ru: /[\u0400-\u04FF]/,
      hi: /[\u0900-\u097F]/,
      th: /[\u0E00-\u0E7F]/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const translationService = new TranslationService();