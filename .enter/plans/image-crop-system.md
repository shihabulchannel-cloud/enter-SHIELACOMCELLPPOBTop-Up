# Plan: Smart Image Upload & Crop System

## Ringkasan
Sistem upload gambar yang menampilkan preview + crop editor sebelum upload ke server.
Upload hanya terjadi setelah admin klik "Simpan" di modal crop.

## Library yang Ditambah
- `react-easy-crop@latest` — MIT license, stabil, support pinch zoom mobile

## File Baru

### 1. `src/lib/image-processing.ts`
Canvas-based image processor:
- `getCroppedImageBlob(src, crop, rotation, flipH, flipV, targetW, targetH, maxBytes)` → `Blob`
- Auto-compress: 90% → 85% → 80% → 75% hingga di bawah maxBytes
- Output: WebP (fallback image/jpeg)
- `getImageMeta(file)` → { width, height, size, format, name }
- `blobToDataUrl(blob)` → base64 string (untuk BannerManager / LogoManager)

### 2. `src/components/admin/ImageCropModal.tsx`
Modal full-screen 2-panel layout:

**Panel Kiri — Crop Editor:**
- react-easy-crop dengan aspect ratio terkunci sesuai preset
- Zoom slider (0.5× – 3×)
- Pinch zoom mobile
- Rotate 90° CW / CCW
- Flip Horizontal / Flip Vertical
- Reset (kembali ke posisi awal)
- Center Image button

**Panel Kanan — Live Preview:**
- Canvas preview update real-time saat crop berubah
- Tabs device: Desktop | Tablet | Mobile
  - Desktop: preview di container 300px wide, aspect ratio preset
  - Tablet: container 180px
  - Mobile: container 120px
- Info: "Hasil akhir: 1440 × 480 px | Max 500 KB"
- Tampilkan estimasi ukuran output

**Header Info Bar:**
- Nama file | Resolusi asli | Ukuran file | Format

**Footer Buttons:**
- [Batal] [Ganti Gambar] [Reset] [Simpan & Upload]

**Preset Config dalam modal:**
```
banner:      ratio 3:1    → 1440×480   max 500KB
thumbnail:   ratio 1:1    → 600×600    max 300KB
subcategory: ratio 3:4    → 600×800    max 300KB
logo:        ratio 1:1    → 200×200    max 200KB
favicon:     ratio 1:1    → 64×64      max 100KB
product:     ratio 1:1    → 600×600    max 500KB
hero_slide:  ratio 16:9   → 1280×720   max 500KB
```

**Safe Area Guide:**
- Tampilkan garis putih tipis (dashed) di 80% dalam crop area
- Label "Safe Zone" — area yang dijamin terlihat di semua device

## File Yang Diupdate

### 3. `src/components/admin/CmsCategoryManager.tsx`
Ganti komponen `ImageUpload` (internal) dengan `SmartImageUpload`:
- Mapping: `folder='thumbnails'` → preset `thumbnail`, `folder='banners'` → preset `banner`, `folder='icons'` → preset `logo`
- Klik Upload → file picker → modal crop terbuka
- Setelah Simpan → upload Blob ke Supabase → callback `onUploaded(url)`
- API eksternal `onUploaded(url: string)` tidak berubah sama sekali

### 4. `src/components/admin/BannerManager.tsx`
- `handleImgUpload` dimodifikasi: file picker → modal crop (preset `hero_slide`) → output base64 → set state
- Semua logic lain tidak berubah

### 5. `src/components/admin/WebsiteManagement.tsx`
- `LogoManager.handleUpload` dimodifikasi: file picker → modal crop (preset `logo`) → output base64 → save ke store
- Semua logic lain tidak berubah

## Alur Upload Baru
```
Klik Upload
  ↓
File picker (pilih gambar)
  ↓
Modal ImageCropModal terbuka
  ├── Header: info file (nama, resolusi asli, ukuran, format)
  ├── Kiri: react-easy-crop editor (drag, zoom, rotate, flip)
  └── Kanan: live canvas preview (update realtime)
  ↓
Admin adjust crop → klik "Simpan & Upload"
  ↓
image-processing.ts:
  - Crop ke area yang dipilih
  - Resize ke target dimensions
  - Compress (90% → 75%) sampai ≤ maxBytes
  - Convert ke WebP
  ↓
Upload blob ke Supabase Storage (atau convert base64)
  ↓
Modal tutup, preview terupdate
```

## Backward Compatibility
- Semua gambar lama yang sudah ada tetap berfungsi (URL tidak berubah)
- Tidak ada perubahan database schema
- Tidak ada perubahan API (callback `onUploaded(url)` tetap sama)
- Karena gambar yang diupload SUDAH di-crop ke rasio yang benar, frontend bisa tetap pakai `object-cover` secara aman

## Yang TIDAK Berubah
- Struktur database
- API fungsi-fungsi yang sudah ada
- Tampilan frontend (Products, ProductCatalog, CategoryBanner, SubCategoryGrid, dll)
- Alur upload yang sudah berhasil (hanya ditambah langkah crop di tengah)
