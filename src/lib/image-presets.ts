/** Image preset configurations used by ImageCropModal and useImageCrop */

export type ImagePresetKey =
  | 'banner'
  | 'thumbnail'
  | 'subcategory'
  | 'logo'
  | 'favicon'
  | 'product'
  | 'hero_slide';

export interface ImagePreset {
  label:    string;
  ratio:    number;
  width:    number;
  height:   number;
  maxBytes: number;
  hint:     string;
  /** Full recommendation text shown below the upload button. */
  helpText: string;
}

function mb(n: number) { return n * 1024 * 1024; }

export const IMAGE_PRESETS: Record<ImagePresetKey, ImagePreset> = {
  banner:      { label: 'Hero Banner',        ratio: 3/1,  width: 1200, height: 400,  maxBytes: 500 * 1024, hint: '1200 × 400 px', helpText: 'Rekomendasi: 1200×400 px · Rasio 3:1 · JPG/PNG/WEBP · Maksimal 0.5 MB' },
  thumbnail:   { label: 'Thumbnail Kategori', ratio: 1/1,  width: 600,  height: 600,  maxBytes: 300 * 1024, hint: '600 × 600 px',   helpText: 'Rekomendasi: 600×600 px · Rasio 1:1 · JPG/PNG/WEBP · Maksimal 0.3 MB' },
  subcategory: { label: 'Sub Kategori',       ratio: 3/4,  width: 600,  height: 800,  maxBytes: 300 * 1024, hint: '600 × 800 px',   helpText: 'Rekomendasi: 600×800 px · Rasio 3:4 · JPG/PNG/WEBP · Maksimal 0.3 MB' },
  logo:        { label: 'Logo',               ratio: 1/1,  width: 512,  height: 512,  maxBytes: mb(2),      hint: '512 × 512 px',   helpText: 'Rekomendasi: 512×512 px · Rasio 1:1 · PNG/WEBP · Maksimal 2 MB' },
  favicon:     { label: 'Favicon',            ratio: 1/1,  width: 64,   height: 64,   maxBytes: 100 * 1024, hint: '64 × 64 px',     helpText: 'Rekomendasi: 64×64 px · Rasio 1:1 · PNG/ICO · Maksimal 0.1 MB' },
  product:     { label: 'Foto Produk',        ratio: 1/1,  width: 600,  height: 600,  maxBytes: 500 * 1024, hint: '600 × 600 px',   helpText: 'Rekomendasi: 600×600 px · Rasio 1:1 · JPG/PNG/WEBP · Maksimal 0.5 MB' },
  hero_slide:  { label: 'Hero Slide',         ratio: 16/6, width: 1920, height: 700,  maxBytes: mb(3),      hint: '1920 × 700 px',  helpText: 'Rekomendasi: 1920×700 px · Rasio 16:6 · JPG/PNG/WEBP · Maksimal 3 MB' },
};
