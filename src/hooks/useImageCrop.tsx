/**
 * useImageCrop — hook untuk mengintegrasikan ImageCropModal ke mana saja.
 *
 * Cara pakai:
 *   const { triggerCrop, cropModal } = useImageCrop({ preset: 'banner', onDone });
 *   return <><Button onClick={triggerCrop} />{cropModal}</>;
 */
import { useState, useCallback, useRef } from 'react';
import ImageCropModal from '@/components/admin/ImageCropModal';
import type { ImagePresetKey } from '@/lib/image-presets';
import { blobToDataUrl } from '@/lib/image-processing';
import { uploadToStorage } from '@/lib/cms-api';

type Folder = 'thumbnails' | 'banners' | 'icons' | 'backgrounds';

interface UseImageCropOptions {
  preset:   ImagePresetKey;
  /** Called with a public URL (Supabase upload) */
  onUrl?:   (url: string) => void;
  /** Called with a base64 DataURL (local store usage) */
  onBase64?: (dataUrl: string) => void;
  /** Supabase storage folder — if provided, upload blob; else return base64 */
  folder?:  Folder;
}

export function useImageCrop({ preset, onUrl, onBase64, folder }: UseImageCropOptions) {
  const [modalOpen, setModalOpen] = useState(false);
  const [file,      setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /** Open file picker, then open modal */
  const triggerCrop = useCallback(() => {
    // Create/reuse a hidden file input
    if (!fileInputRef.current) {
      const input        = document.createElement('input');
      input.type         = 'file';
      input.accept       = 'image/jpeg,image/png,image/webp,image/gif';
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    const input = fileInputRef.current;
    input.value = '';
    input.onchange = (e) => {
      const picked = (e.target as HTMLInputElement).files?.[0];
      if (picked) { setFile(picked); setModalOpen(true); setError(''); }
    };
    input.click();
  }, []);

  /** Allow re-triggering file picker from within the modal (Ganti Gambar) */
  const handleChangeImage = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => triggerCrop(), 100);
  }, [triggerCrop]);

  /** Process blob: upload to Supabase or convert to base64 */
  const handleConfirm = useCallback(async (blob: Blob) => {
    setUploading(true);
    setError('');
    try {
      if (folder && onUrl) {
        // Convert blob to File for Supabase upload
        const ext      = blob.type === 'image/webp' ? 'webp' : 'jpg';
        const fileName = file ? `${file.name.replace(/\.[^.]+$/, '')}.${ext}` : `image.${ext}`;
        const webpFile = new File([blob], fileName, { type: blob.type });
        const { url } = await uploadToStorage(webpFile, folder);
        onUrl(url);
      } else if (onBase64) {
        const dataUrl = await blobToDataUrl(blob);
        onBase64(dataUrl);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setUploading(false);
    }
  }, [folder, onUrl, onBase64, file]);

  const cropModal = (
    <ImageCropModal
      isOpen={modalOpen}
      file={file}
      preset={preset}
      onConfirm={handleConfirm}
      onCancel={() => setModalOpen(false)}
      onChangeImage={handleChangeImage}
    />
  );

  return { triggerCrop, cropModal, uploading, error };
}
