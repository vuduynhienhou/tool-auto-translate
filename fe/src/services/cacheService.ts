export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
  expires: number;
}

export interface CacheOptions {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export class CacheService<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private currentSize = 0;
  private options: CacheOptions;
  private cleanupTimer: number | null = null;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxSize: 100 * 1024 * 1024, // 100MB default
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours default
      cleanupInterval: 5 * 60 * 1000, // 5 minutes cleanup interval
      ...options
    };

    this.startCleanupTimer();
  }

  set(key: string, data: T, ttl?: number, size?: number): void {
    const entrySize = size || this.estimateSize(data);
    const expires = Date.now() + (ttl || this.options.defaultTTL);

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Check if we need to make space
    while (this.currentSize + entrySize > this.options.maxSize && this.cache.size > 0) {
      this.evictLeastRecentlyUsed();
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      size: entrySize,
      expires
    };

    this.cache.set(key, entry);
    this.currentSize += entrySize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.delete(key);
      return null;
    }

    // Update timestamp for LRU
    entry.timestamp = Date.now();
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return true;
    }
    
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  size(): number {
    return this.cache.size;
  }

  sizeInBytes(): number {
    return this.currentSize;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  private estimateSize(data: T): number {
    try {
      // Rough estimation of object size
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default size if serialization fails
    }
  }

  getStats(): {
    entries: number;
    sizeInBytes: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      entries: this.cache.size,
      sizeInBytes: this.currentSize,
      maxSize: this.options.maxSize
    };
  }

  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Image-specific cache service
export class ImageCacheService extends CacheService<string> {
  constructor() {
    super({
      maxSize: 200 * 1024 * 1024, // 200MB for images
      defaultTTL: 2 * 60 * 60 * 1000, // 2 hours for images
      cleanupInterval: 10 * 60 * 1000 // 10 minutes cleanup
    });
  }

  async cacheImage(url: string, quality: number = 0.8): Promise<string> {
    const cacheKey = `${url}-${quality}`;
    
    // Check if already cached
    const cached = this.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Fetch and compress image
      const compressedDataUrl = await this.compressImage(url, quality);
      
      // Calculate size
      const size = this.estimateImageSize(compressedDataUrl);
      
      // Cache the compressed image
      this.set(cacheKey, compressedDataUrl, undefined, size);
      
      return compressedDataUrl;
    } catch (error) {
      console.error('Failed to cache image:', error);
      return url; // Return original URL on failure
    }
  }

  private async compressImage(url: string, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Convert to compressed data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }

  private estimateImageSize(dataUrl: string): number {
    // Data URL format: data:image/jpeg;base64,<data>
    const base64String = dataUrl.split(',')[1];
    if (!base64String) return 1024; // Default size
    
    // Base64 size is roughly 4/3 of the actual size
    return (base64String.length * 3) / 4;
  }

  async prefetchImages(urls: string[], quality: number = 0.8): Promise<void> {
    const promises = urls.map(url => 
      this.cacheImage(url, quality).catch(error => 
        console.warn(`Failed to prefetch image ${url}:`, error)
      )
    );
    
    await Promise.allSettled(promises);
  }
}

// Translation cache service
export class TranslationCacheService extends CacheService<string> {
  constructor() {
    super({
      maxSize: 10 * 1024 * 1024, // 10MB for translations
      defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days for translations
      cleanupInterval: 30 * 60 * 1000 // 30 minutes cleanup
    });
  }

  getCacheKey(text: string, fromLang: string, toLang: string): string {
    return `${fromLang}-${toLang}-${text}`;
  }

  cacheTranslation(text: string, fromLang: string, toLang: string, translation: string): void {
    const key = this.getCacheKey(text, fromLang, toLang);
    this.set(key, translation);
  }

  getCachedTranslation(text: string, fromLang: string, toLang: string): string | null {
    const key = this.getCacheKey(text, fromLang, toLang);
    return this.get(key);
  }
}

// OCR cache service
export class OCRCacheService extends CacheService<any> {
  constructor() {
    super({
      maxSize: 50 * 1024 * 1024, // 50MB for OCR results
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours for OCR results
      cleanupInterval: 15 * 60 * 1000 // 15 minutes cleanup
    });
  }

  getCacheKey(imageUrl: string, language: string): string {
    // Create a hash-like key from the image URL and language
    return `ocr-${language}-${btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;
  }

  cacheOCRResult(imageUrl: string, language: string, result: any): void {
    const key = this.getCacheKey(imageUrl, language);
    this.set(key, result);
  }

  getCachedOCRResult(imageUrl: string, language: string): any | null {
    const key = this.getCacheKey(imageUrl, language);
    return this.get(key);
  }
}

// Global cache instances
export const imageCacheService = new ImageCacheService();
export const translationCacheService = new TranslationCacheService();
export const ocrCacheService = new OCRCacheService();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  imageCacheService.destroy();
  translationCacheService.destroy();
  ocrCacheService.destroy();
});