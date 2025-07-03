# Manga Translator

A comprehensive web application for detecting, translating, and editing text in manga/comic images using advanced OCR and AI translation services.

## Features

### Core Functionality
- **Real OCR Detection**: Uses Tesseract.js with support for Japanese, Chinese, Korean, and English
- **Speech Bubble Detection**: OpenCV.js-based bubble detection for better text region identification
- **Multi-Service Translation**: Supports Google Translate, DeepL, and LibreTranslate APIs with offline fallback
- **Advanced Image Processing**: Canvas-based text overlay with font matching and styling
- **Web Worker Processing**: Background processing for better UI responsiveness

### Translation Services
- **Google Translate API**: High-quality translations with extensive language support
- **DeepL API**: Superior quality for European languages
- **LibreTranslate**: Open-source alternative with self-hosting options
- **Offline Dictionary**: Fallback for common phrases and basic translations

### Advanced Features
- **Intelligent Caching**: Multi-layer caching for images, OCR results, and translations
- **Export Options**: PNG, JPEG, and PDF export with metadata and original image options
- **Settings Management**: Comprehensive configuration for API keys, processing, and UI preferences
- **Progress Tracking**: Real-time progress indicators for all processing steps
- **Edit History**: Undo/redo support for text editing operations

## Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- API keys for translation services (optional but recommended)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd manga-translator
npm install
```

2. **Configure API keys (recommended):**
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
Navigate to `http://localhost:5173`

## Configuration

### API Keys Setup

#### Google Translate API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the "Cloud Translation API"
3. Create credentials (API Key)
4. Add to `.env.local`: `VITE_GOOGLE_TRANSLATE_API_KEY=your_key_here`

#### DeepL API
1. Sign up at [DeepL Pro](https://www.deepl.com/pro-api)
2. Get your API key from the account dashboard
3. Add to `.env.local`: `VITE_DEEPL_API_KEY=your_key_here`

#### LibreTranslate
1. Use the free service: `https://libretranslate.de/translate`
2. Or self-host: Follow [LibreTranslate documentation](https://github.com/LibreTranslate/LibreTranslate)
3. Add to `.env.local`: `VITE_LIBRETRANSLATE_URL=your_url_here`

### Environment Variables

```env
# Translation API Keys
VITE_GOOGLE_TRANSLATE_API_KEY=your_google_key
VITE_DEEPL_API_KEY=your_deepl_key
VITE_LIBRETRANSLATE_URL=https://libretranslate.de/translate
VITE_LIBRETRANSLATE_API_KEY=optional_api_key

# OCR Configuration
VITE_OCR_LANGUAGES=eng+jpn+chi_sim+chi_tra+kor

# Performance Settings
VITE_MAX_IMAGE_SIZE=2073600
VITE_COMPRESSION_QUALITY=0.8
VITE_USE_WEB_WORKERS=true
```

## Usage Guide

### Basic Workflow

1. **Upload Images**
   - Drag and drop manga/comic images
   - Supported formats: PNG, JPEG, WebP
   - Multiple images supported

2. **Configure Languages**
   - Select source language (detected automatically)
   - Choose target language for translation

3. **Processing**
   - Automatic text detection using OCR
   - Speech bubble detection for better accuracy
   - Translation using configured services

4. **Edit and Review**
   - Edit detected text boxes
   - Adjust positioning and styling
   - Review translations for accuracy

5. **Export**
   - Download individual pages or entire project
   - Multiple format options (PNG, JPEG, PDF)
   - Include original images and metadata

### Advanced Features

#### Text Box Editing
- **Move**: Click and drag text boxes
- **Resize**: Use corner handles to resize
- **Edit Text**: Click to edit translated text
- **Styling**: Adjust font, color, and background

#### Settings Configuration
- **Translation Services**: Configure API keys and provider priority
- **OCR Settings**: Adjust language detection and confidence thresholds
- **Processing**: Enable/disable web workers and set image optimization
- **Export**: Default formats and metadata inclusion options

#### Caching System
- **Image Cache**: Compressed images for faster processing
- **OCR Cache**: Cached text detection results
- **Translation Cache**: Cached translations to reduce API calls

## Technical Architecture

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI components
- **State**: Zustand for application state management
- **OCR**: Tesseract.js with multi-language support
- **Computer Vision**: OpenCV.js for speech bubble detection
- **Export**: JSZip for batch downloads, Canvas API for image composition

### Services Architecture
```
├── OCR Service (Tesseract.js)
├── Bubble Detection (OpenCV.js)
├── Translation Service (Multi-provider)
├── Image Processing (Canvas API)
├── Cache Service (Multi-layer caching)
├── Worker Service (Background processing)
├── Export Service (ZIP/PDF generation)
└── Config Service (Settings management)
```

### Performance Optimizations
- **Web Workers**: Heavy processing in background threads
- **Image Compression**: Automatic image optimization
- **Intelligent Caching**: Multi-layer cache with TTL and size limits
- **Lazy Loading**: On-demand service initialization
- **Error Recovery**: Graceful fallbacks for service failures

## API Reference

### Translation Services

#### Google Translate API
- **Endpoint**: `https://translation.googleapis.com/language/translate/v2`
- **Rate Limits**: 100 requests/100 seconds/user
- **Pricing**: $20 per 1M characters

#### DeepL API
- **Endpoint**: `https://api-free.deepl.com/v2/translate`
- **Rate Limits**: 500,000 characters/month (free tier)
- **Pricing**: $5.99/month for 1M characters

#### LibreTranslate
- **Default**: `https://libretranslate.de/translate`
- **Self-hosted**: Configurable endpoint
- **Rate Limits**: Varies by instance

### OCR Configuration

#### Supported Languages
- **English**: `eng`
- **Japanese**: `jpn`
- **Chinese Simplified**: `chi_sim`
- **Chinese Traditional**: `chi_tra`
- **Korean**: `kor`

#### Performance Tuning
- **Confidence Threshold**: 30-90 (recommended: 30)
- **Image Size Limit**: 1920x1080 (recommended)
- **Compression Quality**: 0.8-0.9 (recommended: 0.8)

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── upload/         # File upload components
│   └── progress/       # Progress indicators
├── services/           # Business logic services
│   ├── ocrService.ts   # OCR functionality
│   ├── translationService.ts  # Translation providers
│   ├── bubbleDetection.ts     # Speech bubble detection
│   ├── imageProcessing.ts     # Image manipulation
│   ├── cacheService.ts        # Caching layer
│   └── exportService.ts       # Export functionality
├── workers/            # Web worker implementations
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

### Build Commands
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Translation Providers

1. **Implement the provider:**
```typescript
class NewProvider implements TranslationProvider {
  name = 'New Provider';
  
  async translate(text: string, from: string, to: string): Promise<string> {
    // Implementation
  }
}
```

2. **Add to translation service:**
```typescript
translationService.addProvider(new NewProvider(apiKey));
```

3. **Update configuration UI:**
Add configuration fields in `SettingsPanel.tsx`

## Troubleshooting

### Common Issues

#### OCR Not Working
- **Check browser compatibility**: Tesseract.js requires modern browsers
- **Verify image format**: Use PNG, JPEG, or WebP
- **Check image size**: Large images may cause memory issues
- **Language detection**: Ensure correct source language is selected

#### Translation Failures
- **API Keys**: Verify API keys are correctly configured
- **Rate Limits**: Check if you've exceeded API rate limits
- **Network Issues**: Ensure stable internet connection
- **Fallback**: Check if offline dictionary is working

#### Performance Issues
- **Enable Web Workers**: Check settings for web worker support
- **Image Compression**: Reduce image size or compression quality
- **Cache Size**: Clear cache if it becomes too large
- **Browser Memory**: Close other tabs to free up memory

#### Export Problems
- **File Size**: Large projects may cause export issues
- **Browser Downloads**: Check browser download settings
- **Format Support**: Some browsers may not support PDF export

### Debug Mode
Enable detailed logging in development:
```javascript
localStorage.setItem('debug', 'true');
```

### Browser Compatibility
- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+
- **Required Features**: 
  - Web Workers
  - Canvas API
  - File API
  - Local Storage

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Make changes and test thoroughly
6. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Include JSDoc comments for public APIs
- Test with multiple image types and languages

### Testing
- Test with various image formats and sizes
- Verify translation accuracy across different services
- Test export functionality with large projects
- Check performance with web workers enabled/disabled

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- **Tesseract.js**: OCR functionality
- **OpenCV.js**: Computer vision capabilities
- **Translation APIs**: Google Translate, DeepL, LibreTranslate
- **UI Components**: Radix UI and Tailwind CSS
- **Icons**: Lucide React icons