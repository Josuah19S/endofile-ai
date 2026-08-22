"use client";

import { loadOpenCV, isOpenCVReady } from './opencv-loader';

export interface ValidationConfig {
  /** Threshold for blur detection using Laplacian variance. Below this = blurry. Default: 80 */
  thresholdBlur: number;
  /** Threshold for dark image detection (0-255 average grayscale brightness). Below this = too dark. Default: 45 */
  thresholdBrightness: number;
  /** Minimum contour area percentage (0-100%) of total image. Below this = file too far. Default: 1.5 */
  thresholdMinAreaPercent: number;
  /**
   * Minimum size percentage (0-100%) the object's longest bounding-box side must reach,
   * relative to the image's longest side. Below this = file too far. Default: 20.0
   *
   * Deliberately uses the *longest* side of the bounding box, not just its vertical
   * height: a file photographed diagonally (the natural way to hold one) has a much
   * shorter axis-aligned bounding-box height than the same file held vertically at the
   * same real distance from the camera. Measuring height alone made this check
   * orientation-sensitive instead of distance-sensitive, rejecting perfectly
   * well-framed diagonal shots.
   */
  thresholdMinHeightPercent: number;
  /** Binary inversion threshold value for light background segmentation. Default: 200 */
  binaryThreshold: number;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  thresholdBlur: 35,
  thresholdBrightness: 30,
  thresholdMinAreaPercent: 0.15,
  thresholdMinHeightPercent: 8.0,
  binaryThreshold: 195,
};

export interface BlurValidationResult {
  isBlurry: boolean;
  blurScore: number;
  threshold: number;
}

export interface DarkValidationResult {
  isDark: boolean;
  averageBrightness: number;
  threshold: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TooFarValidationResult {
  isTooFar: boolean;
  areaPercent: number;
  /** The object's longest bounding-box side, as a % of the image's longest side. See `thresholdMinHeightPercent`. */
  heightPercent: number;
  thresholdMinAreaPercent: number;
  thresholdMinHeightPercent: number;
  maxContourArea: number;
  boundingRect: BoundingBox | null;
}

export interface ImageValidationResults {
  blur: BlurValidationResult;
  dark: DarkValidationResult;
  tooFar: TooFarValidationResult;
  hasErrors: boolean;
  warnings: string[];
}

export type InputImageSource = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement;

/**
 * Helper to obtain ImageData from any canvas/image/video element
 */
function getImageDataFromSource(source: InputImageSource): ImageData | null {
  try {
    const canvas = document.createElement('canvas');
    let width = 0;
    let height = 0;

    if (source instanceof HTMLVideoElement) {
      width = source.videoWidth || 640;
      height = source.videoHeight || 480;
    } else if (source instanceof HTMLImageElement) {
      width = source.naturalWidth || source.width;
      height = source.naturalHeight || source.height;
    } else if (source instanceof HTMLCanvasElement) {
      width = source.width;
      height = source.height;
    }

    if (width === 0 || height === 0) return null;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(source, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  } catch (err) {
    console.error("Failed to extract ImageData from source:", err);
    return null;
  }
}

/**
 * 1. Imagen desenfocada: Calculates Variance of Laplacian.
 * Uses OpenCV.js if loaded, or JS Canvas 2D convolution fallback.
 */
export async function validateBlur(
  source: InputImageSource,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): Promise<BlurValidationResult> {
  const threshold = config.thresholdBlur;

  if (isOpenCVReady()) {
    try {
      const cv = window.cv;
      const srcMat = cv.imread(source);
      const grayMat = new cv.Mat();
      const laplacianMat = new cv.Mat();
      const meanMat = new cv.Mat();
      const stddevMat = new cv.Mat();

      cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
      cv.Laplacian(grayMat, laplacianMat, cv.CV_64F);
      cv.meanStdDev(laplacianMat, meanMat, stddevMat);

      const stddev = stddevMat.data64F[0];
      const blurScore = stddev * stddev;

      srcMat.delete();
      grayMat.delete();
      laplacianMat.delete();
      meanMat.delete();
      stddevMat.delete();

      return {
        isBlurry: blurScore < threshold,
        blurScore: Math.round(blurScore * 100) / 100,
        threshold,
      };
    } catch (err) {
      console.warn("OpenCV blur calculation failed, falling back to JS Canvas:", err);
    }
  }

  // Pure Canvas Fallback (Laplacian Kernel [[0,1,0],[1,-4,1],[0,1,0]])
  const imageData = getImageDataFromSource(source);
  if (!imageData) {
    return { isBlurry: false, blurScore: 999, threshold };
  }

  const { data, width, height } = imageData;
  const laplacianValues: number[] = [];

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * 4;
      const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

      const topIdx = ((y - 1) * width + x) * 4;
      const top = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];

      const botIdx = ((y + 1) * width + x) * 4;
      const bot = 0.299 * data[botIdx] + 0.587 * data[botIdx + 1] + 0.114 * data[botIdx + 2];

      const leftIdx = (y * width + (x - 1)) * 4;
      const left = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];

      const rightIdx = (y * width + (x + 1)) * 4;
      const right = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];

      const laplacian = top + bot + left + right - 4 * center;
      laplacianValues.push(laplacian);
    }
  }

  if (laplacianValues.length === 0) {
    return { isBlurry: false, blurScore: 999, threshold };
  }

  const mean = laplacianValues.reduce((a, b) => a + b, 0) / laplacianValues.length;
  const variance = laplacianValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / laplacianValues.length;
  const blurScore = Math.round(variance * 100) / 100;

  return {
    isBlurry: blurScore < threshold,
    blurScore,
    threshold,
  };
}

/**
 * 2. Imagen demasiado oscura: Calculates Average Grayscale Brightness (0-255).
 */
export async function validateBrightness(
  source: InputImageSource,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): Promise<DarkValidationResult> {
  const threshold = config.thresholdBrightness;

  if (isOpenCVReady()) {
    try {
      const cv = window.cv;
      const srcMat = cv.imread(source);
      const grayMat = new cv.Mat();

      cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
      const meanValue = cv.mean(grayMat)[0];

      srcMat.delete();
      grayMat.delete();

      const averageBrightness = Math.round(meanValue * 100) / 100;
      return {
        isDark: averageBrightness < threshold,
        averageBrightness,
        threshold,
      };
    } catch (err) {
      console.warn("OpenCV brightness calculation failed, falling back to JS Canvas:", err);
    }
  }

  // Pure Canvas Fallback
  const imageData = getImageDataFromSource(source);
  if (!imageData) {
    return { isDark: false, averageBrightness: 128, threshold };
  }

  const { data } = imageData;
  let totalBrightness = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const averageBrightness = Math.round((totalBrightness / pixelCount) * 100) / 100;

  return {
    isDark: averageBrightness < threshold,
    averageBrightness,
    threshold,
  };
}

/**
 * 3. Lima demasiado lejos: Uses OpenCV.js contour analysis (no AI model).
 * Leverages light/white background segmentation via binary thresholding.
 */
export async function validateTooFar(
  source: InputImageSource,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): Promise<TooFarValidationResult> {
  const thresholdMinAreaPercent = config.thresholdMinAreaPercent;
  const thresholdMinHeightPercent = config.thresholdMinHeightPercent;

  let width = 0;
  let height = 0;

  if (source instanceof HTMLVideoElement) {
    width = source.videoWidth || 640;
    height = source.videoHeight || 480;
  } else if (source instanceof HTMLImageElement) {
    width = source.naturalWidth || source.width;
    height = source.naturalHeight || source.height;
  } else if (source instanceof HTMLCanvasElement) {
    width = source.width;
    height = source.height;
  }

  if (width === 0 || height === 0) {
    return {
      isTooFar: false,
      areaPercent: 10,
      heightPercent: 50,
      thresholdMinAreaPercent,
      thresholdMinHeightPercent,
      maxContourArea: 0,
      boundingRect: null,
    };
  }

  // If OpenCV is not ready yet, execute instant 2D Canvas threshold fallback
  if (!isOpenCVReady()) {
    const imageData = getImageDataFromSource(source);
    if (imageData) {
      const { data, width: w, height: h } = imageData;
      let minX = w;
      let minY = h;
      let maxX = 0;
      let maxY = 0;
      let foregroundPixels = 0;

      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const idx = (y * w + x) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (gray < config.binaryThreshold) {
            foregroundPixels += 4; // Sample step factor
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const totalArea = w * h;
      const areaPercent = totalArea > 0 ? Math.round((foregroundPixels / totalArea) * 10000) / 100 : 0;
      const boundingHeight = maxY >= minY ? maxY - minY : 0;
      const boundingWidth = maxX >= minX ? maxX - minX : 0;
      // Longest bounding-box side vs. longest image side — orientation-independent (see thresholdMinHeightPercent).
      const maxImageDim = Math.max(w, h);
      const heightPercent = maxImageDim > 0
        ? Math.round((Math.max(boundingWidth, boundingHeight) / maxImageDim) * 10000) / 100
        : 0;

      const isTooFar = areaPercent < thresholdMinAreaPercent || heightPercent < thresholdMinHeightPercent;

      return {
        isTooFar,
        areaPercent,
        heightPercent,
        thresholdMinAreaPercent,
        thresholdMinHeightPercent,
        maxContourArea: foregroundPixels,
        boundingRect: foregroundPixels > 0 ? { x: minX, y: minY, width: maxX - minX, height: boundingHeight } : null,
      };
    }
  }

  // Ensure OpenCV.js is loaded for exact contour analysis
  const cv = await loadOpenCV();

  try {
    const srcMat = cv.imread(source);
    const grayMat = new cv.Mat();
    const binaryMat = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    // 1. Convert to Grayscale
    cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);

    // 2. Segment main file object from white background using Binary Inversion Thresholding
    // White background (> 200) becomes 0 (black), dark file object becomes 255 (white foreground)
    cv.threshold(grayMat, binaryMat, config.binaryThreshold, 255, cv.THRESH_BINARY_INV);

    // 3. Find external contours of segmented object
    cv.findContours(binaryMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxContourIdx = -1;

    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > maxArea) {
        maxArea = area;
        maxContourIdx = i;
      }
    }

    let areaPercent = 0;
    let heightPercent = 0;
    let boundingRect: BoundingBox | null = null;

    const totalImageArea = width * height;
    if (totalImageArea > 0) {
      areaPercent = Math.round((maxArea / totalImageArea) * 10000) / 100;
    }

    if (maxContourIdx !== -1) {
      const maxContour = contours.get(maxContourIdx);
      const rect = cv.boundingRect(maxContour);
      boundingRect = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
      // Longest bounding-box side vs. longest image side — orientation-independent (see thresholdMinHeightPercent).
      const maxImageDim = Math.max(width, height);
      heightPercent = maxImageDim > 0
        ? Math.round((Math.max(rect.width, rect.height) / maxImageDim) * 10000) / 100
        : 0;
    }

    // Clean up OpenCV Mats
    srcMat.delete();
    grayMat.delete();
    binaryMat.delete();
    contours.delete();
    hierarchy.delete();

    const isTooFar = areaPercent < thresholdMinAreaPercent || heightPercent < thresholdMinHeightPercent;

    return {
      isTooFar,
      areaPercent,
      heightPercent,
      thresholdMinAreaPercent,
      thresholdMinHeightPercent,
      maxContourArea: Math.round(maxArea),
      boundingRect,
    };
  } catch (err) {
    console.error("OpenCV contours calculation failed for distance validation:", err);
    return {
      isTooFar: false,
      areaPercent: 5.0,
      heightPercent: 40.0,
      thresholdMinAreaPercent,
      thresholdMinHeightPercent,
      maxContourArea: 0,
      boundingRect: null,
    };
  }
}

/**
 * Runs all three independent image validations simultaneously.
 */
export async function validateAllImages(
  source: InputImageSource,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): Promise<ImageValidationResults> {
  const [blur, dark, tooFar] = await Promise.all([
    validateBlur(source, config),
    validateBrightness(source, config),
    validateTooFar(source, config),
  ]);

  const warnings: string[] = [];
  if (blur.isBlurry) {
    warnings.push(`Imagen desenfocada (Varianza Laplacian: ${blur.blurScore} < ${blur.threshold})`);
  }
  if (dark.isDark) {
    warnings.push(`Imagen demasiado oscura (Brillo: ${dark.averageBrightness} < ${dark.threshold})`);
  }
  if (tooFar.isTooFar) {
    warnings.push(`Lima demasiado lejos (Área: ${tooFar.areaPercent}% < ${tooFar.thresholdMinAreaPercent}%, Extensión: ${tooFar.heightPercent}% < ${tooFar.thresholdMinHeightPercent}%)`);
  }

  return {
    blur,
    dark,
    tooFar,
    hasErrors: warnings.length > 0,
    warnings,
  };
}
