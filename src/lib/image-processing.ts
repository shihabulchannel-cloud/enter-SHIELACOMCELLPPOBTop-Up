/**
 * Client-side image processing:
 * crop → resize → compress → WebP conversion
 */

export interface CropArea {
  x:      number;
  y:      number;
  width:  number;
  height: number;
}

export interface ImageMeta {
  name:       string;
  format:     string;
  size:       number;   // bytes
  width:      number;
  height:     number;
}

/** Read basic metadata from a File without rendering to canvas */
export function getImageMeta(file: File): Promise<ImageMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img  = new Image();
    img.onload = () => {
      resolve({
        name:   file.name,
        format: file.type || 'image/jpeg',
        size:   file.size,
        width:  img.naturalWidth,
        height: img.naturalHeight,
      });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal membaca gambar'));
    };
    img.src = url;
  });
}

/** Load an image element from a URL / DataURL */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img  = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
    img.src     = src;
  });
}

/**
 * Core function: crop + rotate + flip + resize → Blob
 *
 * @param imageSrc      - object URL / data URL of original image
 * @param pixelCrop     - area to crop in original image pixels
 * @param rotation      - degrees (0, 90, 180, 270)
 * @param flipH         - flip horizontal
 * @param flipV         - flip vertical
 * @param targetWidth   - output width in pixels
 * @param targetHeight  - output height in pixels
 * @param maxBytes      - max file size; auto-compress if exceeded
 * @returns             - processed WebP (or JPEG) Blob
 */
export async function getCroppedImageBlob(
  imageSrc:    string,
  pixelCrop:   CropArea,
  rotation:    number   = 0,
  flipH:       boolean  = false,
  flipV:       boolean  = false,
  targetWidth: number,
  targetHeight: number,
  maxBytes:    number,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  // ── Step 1: draw the (possibly rotated/flipped) source onto an off-screen canvas ──
  const radians   = (rotation * Math.PI) / 180;
  const sinA      = Math.abs(Math.sin(radians));
  const cosA      = Math.abs(Math.cos(radians));
  const bw        = Math.round(image.width  * cosA + image.height * sinA);
  const bh        = Math.round(image.width  * sinA + image.height * cosA);

  const srcCanvas  = document.createElement('canvas');
  srcCanvas.width  = bw;
  srcCanvas.height = bh;
  const srcCtx     = srcCanvas.getContext('2d')!;

  srcCtx.translate(bw / 2, bh / 2);
  srcCtx.rotate(radians);
  srcCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  srcCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // ── Step 2: crop from the rotated canvas ──
  const cropCanvas  = document.createElement('canvas');
  cropCanvas.width  = pixelCrop.width;
  cropCanvas.height = pixelCrop.height;
  const cropCtx     = cropCanvas.getContext('2d')!;
  cropCtx.drawImage(
    srcCanvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );

  // ── Step 3: resize to target dimensions ──
  const outCanvas  = document.createElement('canvas');
  outCanvas.width  = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx     = outCanvas.getContext('2d')!;
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(cropCanvas, 0, 0, targetWidth, targetHeight);

  // ── Step 4: compress with quality fallback until under maxBytes ──
  const supportsWebP = canvasSupportsWebP();
  const mimeType     = supportsWebP ? 'image/webp' : 'image/jpeg';
  const qualities    = [0.90, 0.85, 0.80, 0.75, 0.65];

  for (const q of qualities) {
    const blob = await canvasToBlob(outCanvas, mimeType, q);
    if (blob.size <= maxBytes || q === qualities[qualities.length - 1]) {
      return blob;
    }
  }

  // Fallback: return at lowest quality (should not reach here normally)
  return canvasToBlob(outCanvas, mimeType, 0.65);
}

/** Convert a canvas region to a small preview DataURL (fast, low-res) */
export async function getPreviewDataUrl(
  imageSrc:   string,
  pixelCrop:  CropArea,
  rotation:   number  = 0,
  flipH:      boolean = false,
  flipV:      boolean = false,
  previewW:   number  = 300,
  previewH:   number  = 300,
): Promise<string> {
  const blob = await getCroppedImageBlob(
    imageSrc, pixelCrop, rotation, flipH, flipV,
    previewW, previewH,
    10 * 1024 * 1024, // no size limit for preview
  );
  return URL.createObjectURL(blob);
}

/** Convert Blob to base64 DataURL */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Konversi base64 gagal'));
    reader.readAsDataURL(blob);
  });
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')),
      mime,
      quality,
    );
  });
}

function canvasSupportsWebP(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}
