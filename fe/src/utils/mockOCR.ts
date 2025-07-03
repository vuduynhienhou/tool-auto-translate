import { TextBox } from '@/types'
import { generateId } from '@/lib/utils'

// Simulated OCR detection - in real implementation, this would use actual OCR API
export const detectTextBoxes = async (imageUrl: string): Promise<TextBox[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // Generate mock text boxes with realistic positions
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
      sourceLanguage: 'ja',
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
      sourceLanguage: 'ja',
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
      sourceLanguage: 'ja',
      targetLanguage: 'en'
    }
  ]
  
  return mockTextBoxes
}

export const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
  // Simulate translation API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  
  // Mock translations
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
    'いただきます': 'Let\'s eat'
  }
  
  return translations[text] || `[Translated: ${text}]`
}

export const detectLanguage = async (text: string): Promise<string> => {
  // Simple language detection based on character patterns
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
  const chinesePattern = /[\u4E00-\u9FFF]/
  const koreanPattern = /[\uAC00-\uD7AF]/
  
  if (japanesePattern.test(text)) return 'ja'
  if (chinesePattern.test(text)) return 'zh'
  if (koreanPattern.test(text)) return 'ko'
  
  return 'en'
}