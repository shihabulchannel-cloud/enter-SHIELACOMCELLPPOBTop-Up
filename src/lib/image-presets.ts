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
}

export const IMAGE_PRESETS: Record<ImagePresetKey, ImagePreset> = {
  banner:      { label: 'Hero Banner',        ratio: 3/1,  width: 1440, height: 480,  maxBytes: 500 * 1024, hint: '1440 × 480 px' },
  thumbnail:   { label: 'Thumbnail Kategori', ratio: 1/1,  width: 600,  height: 600,  maxBytes: 300 * 1024, hint: '600 × 600 px'  },
  subcategory: { label: 'Sub Kategori',       ratio: 3/4,  width: 600,  height: 800,  maxBytes: 300 * 1024, hint: '600 × 800 px'  },
  logo:        { label: 'Logo',               ratio: 1/1,  width: 200,  height: 200,  maxBytes: 200 * 1024, hint: '200 × 200 px'  },
  favicon:     { label: 'Favicon',            ratio: 1/1,  width: 64,   height: 64,   maxBytes: 100 * 1024, hint: '64 × 64 px'    },
  product:     { label: 'Foto Produk',        ratio: 1/1,  width: 600,  height: 600,  maxBytes: 500 * 1024, hint: '600 × 600 px'  },
  hero_slide:  { label: 'Hero Slide',         ratio: 16/9, width: 1280, height: 720,  maxBytes: 500 * 1024, hint: '1280 × 720 px' },
};
