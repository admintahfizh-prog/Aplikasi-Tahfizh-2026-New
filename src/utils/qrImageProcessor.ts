import jsQR from 'jsqr';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  GlobalHistogramBinarizer
} from '@zxing/library';

export interface QrDecodeResult {
  text: string;
  engine: 'zxing-hybrid' | 'zxing-global' | 'jsqr' | 'jsqr-roi' | 'jsqr-enhanced' | 'native';
  cornerPoints?: Array<{ x: number; y: number }>;
}

// Singleton ZXing MultiFormatReader configured with TRY_HARDER and QR + 1D Barcode formats
const zxingReader = new MultiFormatReader();
const zxingHints = new Map<DecodeHintType, any>();
zxingHints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.DATA_MATRIX
]);
zxingHints.set(DecodeHintType.TRY_HARDER, true);
zxingReader.setHints(zxingHints);

/**
 * Decodes an ImageData buffer using ZXing's RGBLuminanceSource with both
 * HybridBinarizer (best for uneven lighting/shadows) and GlobalHistogramBinarizer (best for low contrast).
 */
function decodeWithZxing(imageData: ImageData): QrDecodeResult | null {
  const { data, width, height } = imageData;
  if (width <= 0 || height <= 0) return null;

  try {
    const len = width * height;
    const luminances = new Uint8ClampedArray(len);
    for (let i = 0, j = 0; i < len; i++, j += 4) {
      // Fast ITU-R BT.601 luma approximation: (R*77 + G*150 + B*29) >> 8
      luminances[i] = (data[j] * 77 + data[j + 1] * 150 + data[j + 2] * 29) >> 8;
    }

    const source = new RGBLuminanceSource(luminances, width, height);

    // 1. Try HybridBinarizer (local adaptive block thresholding)
    try {
      const hybridBitmap = new BinaryBitmap(new HybridBinarizer(source));
      const result = zxingReader.decodeWithState(hybridBitmap);
      if (result && result.getText()) {
        const pts = result.getResultPoints()?.map(p => ({
          x: p.getX(),
          y: p.getY()
        }));
        return {
          text: result.getText().trim(),
          engine: 'zxing-hybrid',
          cornerPoints: pts
        };
      }
    } catch {
      // continue to fallback binarizer
    }

    // 2. Try GlobalHistogramBinarizer (fast global histogram thresholding)
    try {
      const globalBitmap = new BinaryBitmap(new GlobalHistogramBinarizer(source));
      const result = zxingReader.decodeWithState(globalBitmap);
      if (result && result.getText()) {
        return {
          text: result.getText().trim(),
          engine: 'zxing-global'
        };
      }
    } catch {
      // continue
    }

    // 3. Try inverted luminance source (white QR on dark background)
    try {
      const invertedBitmap = new BinaryBitmap(new HybridBinarizer(source.invert()));
      const result = zxingReader.decodeWithState(invertedBitmap);
      if (result && result.getText()) {
        return {
          text: result.getText().trim(),
          engine: 'zxing-hybrid'
        };
      }
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Applies dynamic range contrast stretching and adaptive local thresholding
 * to recover washed-out, low-light, or screen-glare QR codes.
 */
function createContrastEnhancedImageData(source: ImageData): ImageData {
  const { data, width, height } = source;
  const out = new Uint8ClampedArray(data.length);

  let minLuma = 255;
  let maxLuma = 0;
  const len = width * height;
  const luma = new Uint8Array(len);

  for (let i = 0, j = 0; i < len; i++, j += 4) {
    const y = (data[j] * 77 + data[j + 1] * 150 + data[j + 2] * 29) >> 8;
    luma[i] = y;
    if (y < minLuma) minLuma = y;
    if (y > maxLuma) maxLuma = y;
  }

  const range = Math.max(1, maxLuma - minLuma);
  const midPoint = minLuma + (range >> 1);

  for (let i = 0, j = 0; i < len; i++, j += 4) {
    // Stretch contrast to 0..255 with steep sigmoid-like curve around midpoint
    const normalized = ((luma[i] - minLuma) * 255) / range;
    const boosted =
      luma[i] < midPoint
        ? Math.max(0, normalized * 0.65)
        : Math.min(255, normalized * 1.25 + 25);
    const val = boosted < 122 ? 0 : 255;
    out[j] = val;
    out[j + 1] = val;
    out[j + 2] = val;
    out[j + 3] = 255;
  }

  return new ImageData(out, width, height);
}

/**
 * Extracts a centered Region-of-Interest (ROI) sub-image from the source canvas
 * so smaller or further-away QR codes inside the target box are decoded with higher precision.
 */
function extractCenterRoiImageData(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  roiRatio = 0.62
): { imageData: ImageData; offsetX: number; offsetY: number } | null {
  const roiW = Math.floor(width * roiRatio);
  const roiH = Math.floor(height * roiRatio);
  if (roiW < 80 || roiH < 80) return null;

  const offsetX = Math.floor((width - roiW) / 2);
  const offsetY = Math.floor((height - roiH) / 2);
  const imageData = ctx.getImageData(offsetX, offsetY, roiW, roiH);
  return { imageData, offsetX, offsetY };
}

/**
 * Multi-pass frame decoder for live camera video frames:
 * Pass 1: ZXing MultiFormatReader (Hybrid + Global Histogram + Inverted)
 * Pass 2: jsQR full frame
 * Pass 3: Center ROI crop (62%) for distant/small QR codes
 * Pass 4: Contrast-enhanced & binarized pass (runs on alternate frames for low-light/glare)
 */
export async function decodeQrFromVideoFrame(
  video: HTMLVideoElement,
  workCanvas: HTMLCanvasElement,
  frameCounter: number,
  nativeDetector?: {
    detect: (
      source: HTMLVideoElement | HTMLCanvasElement
    ) => Promise<Array<{ rawValue: string }>>;
  } | null
): Promise<QrDecodeResult | null> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  // Normalize working resolution (max 640px wide for optimal speed & sharpness)
  const scale = vw > 640 ? 640 / vw : 1;
  const w = Math.floor(vw * scale);
  const h = Math.floor(vh * scale);

  if (workCanvas.width !== w) workCanvas.width = w;
  if (workCanvas.height !== h) workCanvas.height = h;

  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, w, h);
  const fullImageData = ctx.getImageData(0, 0, w, h);

  // Pass 1: ZXing MultiFormatReader (handles QR + 1D Barcodes + uneven lighting)
  const zxingHit = decodeWithZxing(fullImageData);
  if (zxingHit) return zxingHit;

  // Pass 2: jsQR on full frame
  const jsqrFull = jsQR(fullImageData.data, w, h, {
    inversionAttempts: 'attemptBoth'
  });
  if (jsqrFull && jsqrFull.data) {
    return {
      text: jsqrFull.data.trim(),
      engine: 'jsqr',
      cornerPoints: [
        jsqrFull.location.topLeftCorner,
        jsqrFull.location.topRightCorner,
        jsqrFull.location.bottomRightCorner,
        jsqrFull.location.bottomLeftCorner
      ]
    };
  }

  // Pass 3: Center ROI Crop (when QR code is smaller in the center viewfinder)
  const roi = extractCenterRoiImageData(ctx, w, h, 0.62);
  if (roi) {
    const zxingRoi = decodeWithZxing(roi.imageData);
    if (zxingRoi) return zxingRoi;

    const jsqrRoi = jsQR(roi.imageData.data, roi.imageData.width, roi.imageData.height, {
      inversionAttempts: 'attemptBoth'
    });
    if (jsqrRoi && jsqrRoi.data) {
      return {
        text: jsqrRoi.data.trim(),
        engine: 'jsqr-roi',
        cornerPoints: [
          {
            x: jsqrRoi.location.topLeftCorner.x + roi.offsetX,
            y: jsqrRoi.location.topLeftCorner.y + roi.offsetY
          },
          {
            x: jsqrRoi.location.topRightCorner.x + roi.offsetX,
            y: jsqrRoi.location.topRightCorner.y + roi.offsetY
          },
          {
            x: jsqrRoi.location.bottomRightCorner.x + roi.offsetX,
            y: jsqrRoi.location.bottomRightCorner.y + roi.offsetY
          },
          {
            x: jsqrRoi.location.bottomLeftCorner.x + roi.offsetX,
            y: jsqrRoi.location.bottomLeftCorner.y + roi.offsetY
          }
        ]
      };
    }
  }

  // Pass 4: Contrast-stretched & adaptive binarized pass (every 2nd frame to keep 60fps smooth)
  if (frameCounter % 2 === 0) {
    const targetData = roi ? roi.imageData : fullImageData;
    const enhanced = createContrastEnhancedImageData(targetData);

    const zxingEnhanced = decodeWithZxing(enhanced);
    if (zxingEnhanced) {
      return { ...zxingEnhanced, engine: 'jsqr-enhanced' };
    }

    const jsqrEnhanced = jsQR(enhanced.data, enhanced.width, enhanced.height, {
      inversionAttempts: 'attemptBoth'
    });
    if (jsqrEnhanced && jsqrEnhanced.data) {
      return {
        text: jsqrEnhanced.data.trim(),
        engine: 'jsqr-enhanced'
      };
    }
  }

  // Pass 5: Native browser BarcodeDetector hardware acceleration if available
  if (nativeDetector) {
    try {
      const codes = await nativeDetector.detect(workCanvas);
      if (codes && codes.length > 0 && codes[0].rawValue) {
        return {
          text: String(codes[0].rawValue).trim(),
          engine: 'native'
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Multi-scale & multi-pass decoder for uploaded static images of QR / Student ID Cards.
 * Tests multiple resolutions (original, 900px, 550px), center crops, and contrast enhancement.
 */
export function decodeQrFromImageElement(img: HTMLImageElement): QrDecodeResult | null {
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  if (!natW || !natH) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const candidateWidths = [natW, 900, 600, 400];

  for (const targetW of candidateWidths) {
    const scale = targetW / natW;
    const w = Math.max(120, Math.floor(natW * scale));
    const h = Math.max(120, Math.floor(natH * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);

    // 1. ZXing
    const zxingRes = decodeWithZxing(imgData);
    if (zxingRes) return zxingRes;

    // 2. jsQR
    const jsqrRes = jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
    if (jsqrRes && jsqrRes.data) {
      return {
        text: jsqrRes.data.trim(),
        engine: 'jsqr'
      };
    }

    // 3. Contrast enhanced
    const enhanced = createContrastEnhancedImageData(imgData);
    const zxingEnh = decodeWithZxing(enhanced);
    if (zxingEnh) return zxingEnh;

    const jsqrEnh = jsQR(enhanced.data, w, h, { inversionAttempts: 'attemptBoth' });
    if (jsqrEnh && jsqrEnh.data) {
      return {
        text: jsqrEnh.data.trim(),
        engine: 'jsqr-enhanced'
      };
    }
  }

  return null;
}
