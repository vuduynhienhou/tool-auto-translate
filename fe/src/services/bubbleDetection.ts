import cv from 'opencv.js';

export interface BubbleRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  type: 'speech' | 'thought' | 'shout' | 'whisper';
}

export class BubbleDetectionService {
  private isOpenCVReady = false;

  async initialize(): Promise<void> {
    if (this.isOpenCVReady) return;

    return new Promise((resolve) => {
      if (cv.getBuildInformation) {
        this.isOpenCVReady = true;
        resolve();
      } else {
        cv.onRuntimeInitialized = () => {
          this.isOpenCVReady = true;
          resolve();
        };
      }
    });
  }

  async detectBubbles(imageUrl: string): Promise<BubbleRegion[]> {
    if (!this.isOpenCVReady) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const bubbles = this.processBubbleDetection(img);
          resolve(bubbles);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for bubble detection'));
      };

      img.src = imageUrl;
    });
  }

  private processBubbleDetection(img: HTMLImageElement): BubbleRegion[] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Convert to OpenCV Mat
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Apply Gaussian blur to reduce noise
      const blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Adaptive threshold to create binary image
      cv.adaptiveThreshold(
        blurred,
        binary,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        11,
        2
      );

      // Find contours
      cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const bubbles: BubbleRegion[] = [];
      const imageArea = img.width * img.height;

      // Process each contour
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const rect = cv.boundingRect(contour);
        const area = cv.contourArea(contour);
        const perimeter = cv.arcLength(contour, true);
        
        // Calculate shape properties
        const aspectRatio = rect.width / rect.height;
        const extent = area / (rect.width * rect.height);
        const solidity = area / cv.contourArea(cv.convexHull(contour, new cv.Mat(), false, true));
        
        // Filter potential speech bubbles
        if (this.isSpeechBubble(rect, area, aspectRatio, extent, solidity, imageArea)) {
          const bubbleType = this.classifyBubbleType(contour, area, perimeter, aspectRatio);
          
          bubbles.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            confidence: this.calculateBubbleConfidence(extent, solidity, aspectRatio),
            type: bubbleType
          });
        }

        contour.delete();
      }

      // Clean up
      blurred.delete();
      
      return bubbles.sort((a, b) => b.confidence - a.confidence);

    } finally {
      // Clean up OpenCV Mats
      src.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();
    }
  }

  private isSpeechBubble(
    rect: cv.Rect,
    area: number,
    aspectRatio: number,
    extent: number,
    solidity: number,
    imageArea: number
  ): boolean {
    // Size constraints
    const minArea = imageArea * 0.001; // At least 0.1% of image
    const maxArea = imageArea * 0.3;   // At most 30% of image
    const minWidth = 30;
    const minHeight = 20;

    // Shape constraints
    const minAspectRatio = 0.3;
    const maxAspectRatio = 5.0;
    const minExtent = 0.3;
    const minSolidity = 0.6;

    return (
      area >= minArea &&
      area <= maxArea &&
      rect.width >= minWidth &&
      rect.height >= minHeight &&
      aspectRatio >= minAspectRatio &&
      aspectRatio <= maxAspectRatio &&
      extent >= minExtent &&
      solidity >= minSolidity
    );
  }

  private classifyBubbleType(
    contour: cv.Mat,
    area: number,
    perimeter: number,
    aspectRatio: number
  ): BubbleRegion['type'] {
    // Calculate circularity
    const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
    
    // Approximate polygon to check for jagged edges
    const epsilon = 0.02 * perimeter;
    const approx = new cv.Mat();
    cv.approxPolyDP(contour, approx, epsilon, true);
    const vertices = approx.rows;
    approx.delete();

    // Classification based on shape characteristics
    if (circularity > 0.7) {
      return 'thought'; // Round bubbles are usually thought bubbles
    } else if (vertices > 8 && circularity < 0.4) {
      return 'shout'; // Jagged edges indicate shouting
    } else if (area < 1000) {
      return 'whisper'; // Small bubbles are whispers
    } else {
      return 'speech'; // Default to speech bubble
    }
  }

  private calculateBubbleConfidence(
    extent: number,
    solidity: number,
    aspectRatio: number
  ): number {
    // Weighted confidence based on shape properties
    const extentScore = Math.min(extent * 2, 1.0);
    const solidityScore = Math.min(solidity * 1.5, 1.0);
    const aspectRatioScore = aspectRatio > 0.5 && aspectRatio < 2.5 ? 1.0 : 0.7;

    return (extentScore * 0.4 + solidityScore * 0.4 + aspectRatioScore * 0.2);
  }

  async enhanceTextRegions(imageUrl: string, textBoxes: any[]): Promise<any[]> {
    // Enhance text regions by analyzing the image around detected text
    if (!this.isOpenCVReady) {
      await this.initialize();
    }

    const bubbles = await this.detectBubbles(imageUrl);
    
    // Match text boxes with speech bubbles
    return textBoxes.map(textBox => {
      const matchingBubble = bubbles.find(bubble => 
        this.isTextInsideBubble(textBox, bubble)
      );

      if (matchingBubble) {
        return {
          ...textBox,
          x: matchingBubble.x,
          y: matchingBubble.y,
          width: matchingBubble.width,
          height: matchingBubble.height,
          bubbleType: matchingBubble.type,
          confidence: Math.max(textBox.confidence, matchingBubble.confidence)
        };
      }

      return textBox;
    });
  }

  private isTextInsideBubble(textBox: any, bubble: BubbleRegion): boolean {
    const textCenterX = textBox.x + textBox.width / 2;
    const textCenterY = textBox.y + textBox.height / 2;
    
    const bubbleCenterX = bubble.x + bubble.width / 2;
    const bubbleCenterY = bubble.y + bubble.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(textCenterX - bubbleCenterX, 2) + 
      Math.pow(textCenterY - bubbleCenterY, 2)
    );
    
    const maxDistance = Math.max(bubble.width, bubble.height) / 2;
    
    return distance < maxDistance;
  }
}

export const bubbleDetectionService = new BubbleDetectionService();