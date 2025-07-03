import '@testing-library/jest-dom'

// Mock implementations for browser APIs that aren't available in tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Mock Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  drawImage: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  }),
  putImageData: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
})

global.HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,test')
global.HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((callback) => {
  callback(new Blob(['test'], { type: 'image/png' }))
})

// Mock File Reader API
global.FileReader = class FileReader {
  result = 'data:image/png;base64,test'
  error = null
  readyState = 2 // DONE
  
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()
  
  onload = null
  onerror = null
  onabort = null
  onloadstart = null
  onloadend = null
  onprogress = null
  
  readAsDataURL = vi.fn().mockImplementation(() => {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this } as any)
      }
    }, 0)
  })
  
  readAsText = vi.fn()
  readAsArrayBuffer = vi.fn()
  readAsBinaryString = vi.fn()
  abort = vi.fn()
  
  static readonly EMPTY = 0
  static readonly LOADING = 1
  static readonly DONE = 2
  
  readonly EMPTY = 0
  readonly LOADING = 1
  readonly DONE = 2
}

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test')
global.URL.revokeObjectURL = vi.fn()

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
})

// Mock Worker
global.Worker = class Worker {
  constructor(stringUrl: string | URL, options?: WorkerOptions) {}
  onmessage = null
  onerror = null
  onmessageerror = null
  postMessage = vi.fn()
  terminate = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()
}