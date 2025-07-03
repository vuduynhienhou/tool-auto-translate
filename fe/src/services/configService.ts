import { translationService } from './translationService';

export interface AppConfig {
  // Translation API keys
  googleTranslateApiKey?: string;
  deepLApiKey?: string;
  libreTranslateUrl?: string;
  libreTranslateApiKey?: string;
  
  // OCR settings
  ocrLanguages: string;
  ocrConfidenceThreshold: number;
  
  // Processing settings
  useWebWorkers: boolean;
  maxImageSize: number;
  compressionQuality: number;
  
  // UI settings
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  showConfidenceScores: boolean;
  
  // Export settings
  defaultExportFormat: 'png' | 'jpeg' | 'pdf';
  includeOriginalInExport: boolean;
  includeMetadataInExport: boolean;
}

export class ConfigService {
  private config: AppConfig;
  private readonly storageKey = 'manga-translator-config';

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
  }

  private getDefaultConfig(): AppConfig {
    return {
      // Translation settings
      googleTranslateApiKey: undefined,
      deepLApiKey: undefined,
      libreTranslateUrl: 'https://libretranslate.de/translate',
      libreTranslateApiKey: undefined,
      
      // OCR settings
      ocrLanguages: 'eng+jpn+chi_sim+chi_tra+kor',
      ocrConfidenceThreshold: 30,
      
      // Processing settings
      useWebWorkers: true,
      maxImageSize: 1920 * 1080,
      compressionQuality: 0.8,
      
      // UI settings
      theme: 'system',
      autoSave: true,
      showConfidenceScores: true,
      
      // Export settings
      defaultExportFormat: 'png',
      includeOriginalInExport: false,
      includeMetadataInExport: true
    };
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.applyConfig();
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.config = { ...this.config, ...parsedConfig };
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
    }
    
    this.applyConfig();
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }

  private applyConfig(): void {
    // Setup translation services based on config
    this.setupTranslationServices();
    
    // Apply theme
    this.applyTheme();
  }

  private setupTranslationServices(): void {
    // Clear existing providers and setup new ones based on config
    translationService.clearCache();

    // Setup Google Translate if API key is provided
    if (this.config.googleTranslateApiKey) {
      translationService.setupGoogleTranslate(this.config.googleTranslateApiKey);
      console.log('Google Translate configured');
    }

    // Setup DeepL if API key is provided
    if (this.config.deepLApiKey) {
      translationService.setupDeepL(this.config.deepLApiKey);
      console.log('DeepL configured');
    }

    // Setup LibreTranslate
    if (this.config.libreTranslateUrl) {
      translationService.setupLibreTranslate(
        this.config.libreTranslateUrl,
        this.config.libreTranslateApiKey
      );
      console.log('LibreTranslate configured');
    }
  }

  private applyTheme(): void {
    const root = document.documentElement;
    
    if (this.config.theme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', this.config.theme === 'dark');
    }
  }

  // Helper methods for specific settings
  hasTranslationProvider(): boolean {
    return !!(
      this.config.googleTranslateApiKey ||
      this.config.deepLApiKey ||
      this.config.libreTranslateUrl
    );
  }

  getTranslationProviders(): string[] {
    const providers: string[] = ['Offline Dictionary']; // Always available
    
    if (this.config.googleTranslateApiKey) {
      providers.unshift('Google Translate');
    }
    
    if (this.config.deepLApiKey) {
      providers.unshift('DeepL');
    }
    
    if (this.config.libreTranslateUrl) {
      providers.push('LibreTranslate');
    }
    
    return providers;
  }

  exportConfig(): string {
    // Export config without sensitive data (API keys)
    const exportableConfig = { ...this.config };
    delete exportableConfig.googleTranslateApiKey;
    delete exportableConfig.deepLApiKey;
    delete exportableConfig.libreTranslateApiKey;
    
    return JSON.stringify(exportableConfig, null, 2);
  }

  importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      
      // Validate config structure
      if (typeof importedConfig === 'object' && importedConfig !== null) {
        // Only import non-sensitive settings
        const safeConfig = {
          ocrLanguages: importedConfig.ocrLanguages,
          ocrConfidenceThreshold: importedConfig.ocrConfidenceThreshold,
          useWebWorkers: importedConfig.useWebWorkers,
          maxImageSize: importedConfig.maxImageSize,
          compressionQuality: importedConfig.compressionQuality,
          theme: importedConfig.theme,
          autoSave: importedConfig.autoSave,
          showConfidenceScores: importedConfig.showConfidenceScores,
          defaultExportFormat: importedConfig.defaultExportFormat,
          includeOriginalInExport: importedConfig.includeOriginalInExport,
          includeMetadataInExport: importedConfig.includeMetadataInExport,
          libreTranslateUrl: importedConfig.libreTranslateUrl
        };
        
        this.updateConfig(safeConfig);
        return true;
      }
    } catch (error) {
      console.error('Failed to import config:', error);
    }
    
    return false;
  }

  resetConfig(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    this.applyConfig();
  }

  // Environment variable support
  loadFromEnvironment(): void {
    const envConfig: Partial<AppConfig> = {};
    
    // Check for environment variables (useful for deployment)
    if (import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY) {
      envConfig.googleTranslateApiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
    }
    
    if (import.meta.env.VITE_DEEPL_API_KEY) {
      envConfig.deepLApiKey = import.meta.env.VITE_DEEPL_API_KEY;
    }
    
    if (import.meta.env.VITE_LIBRETRANSLATE_URL) {
      envConfig.libreTranslateUrl = import.meta.env.VITE_LIBRETRANSLATE_URL;
    }
    
    if (import.meta.env.VITE_LIBRETRANSLATE_API_KEY) {
      envConfig.libreTranslateApiKey = import.meta.env.VITE_LIBRETRANSLATE_API_KEY;
    }
    
    if (Object.keys(envConfig).length > 0) {
      this.updateConfig(envConfig);
      console.log('Configuration loaded from environment variables');
    }
  }
}

// Singleton instance
export const configService = new ConfigService();

// Load environment variables on startup
configService.loadFromEnvironment();