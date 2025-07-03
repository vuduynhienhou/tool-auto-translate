import { WorkerMessage, WorkerResponse } from '../workers/processingWorker';

export interface WorkerTask {
  id: string;
  type: 'OCR_DETECT' | 'TRANSLATE_TEXT' | 'PROCESS_IMAGE';
  payload: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

export class WorkerService {
  private worker: Worker | null = null;
  private tasks: Map<string, WorkerTask> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create worker from the processing worker file
      this.worker = new Worker(
        new URL('../workers/processingWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);

      this.isInitialized = true;
      console.log('Worker service initialized');
    } catch (error) {
      console.error('Failed to initialize worker service:', error);
      throw new Error('Worker service initialization failed');
    }
  }

  async performOCR(imageUrl: string, language: string = 'jpn'): Promise<any> {
    return this.executeTask('OCR_DETECT', { imageUrl, language });
  }

  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    return this.executeTask('TRANSLATE_TEXT', { text, fromLang, toLang });
  }

  async processImage(imageData: ImageData, operation: string): Promise<any> {
    return this.executeTask('PROCESS_IMAGE', { imageData, operation });
  }

  private async executeTask(type: WorkerTask['type'], payload: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const taskId = this.generateTaskId();

    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: taskId,
        type,
        payload,
        resolve,
        reject
      };

      this.tasks.set(taskId, task);

      const message: WorkerMessage = {
        id: taskId,
        type,
        payload
      };

      this.worker!.postMessage(message);

      // Set timeout to prevent hanging tasks
      setTimeout(() => {
        if (this.tasks.has(taskId)) {
          this.tasks.delete(taskId);
          reject(new Error('Task timeout'));
        }
      }, 60000); // 60 second timeout
    });
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, type, payload, error } = event.data;
    const task = this.tasks.get(id);

    if (!task) {
      console.warn('Received response for unknown task:', id);
      return;
    }

    this.tasks.delete(id);

    if (type === 'SUCCESS') {
      task.resolve(payload);
    } else if (type === 'ERROR') {
      task.reject(new Error(error || 'Worker task failed'));
    } else if (type === 'PROGRESS') {
      // Handle progress updates if needed
      console.log('Task progress:', payload);
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker error:', error);
    
    // Reject all pending tasks
    this.tasks.forEach(task => {
      task.reject(new Error('Worker error occurred'));
    });
    
    this.tasks.clear();
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveTaskCount(): number {
    return this.tasks.size;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      // Reject all pending tasks
      this.tasks.forEach(task => {
        task.reject(new Error('Worker terminated'));
      });
      
      this.tasks.clear();
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  isWorkerAvailable(): boolean {
    return this.isInitialized && this.worker !== null;
  }
}

// Singleton instance
export const workerService = new WorkerService();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  workerService.terminate();
});