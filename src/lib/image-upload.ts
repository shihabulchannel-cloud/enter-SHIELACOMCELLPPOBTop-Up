// Image upload helper — converts files to base64 data URLs for localStorage storage

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/^image\/(jpeg|png|webp|svg\+xml|gif)$/)) {
      reject(new Error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau SVG.'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('Ukuran file terlalu besar. Maksimal 2MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });
}

export function triggerFileInput(
  onFile: (file: File) => void,
  accept = 'image/jpeg,image/png,image/webp,image/svg+xml'
) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) onFile(file);
  };
  input.click();
}
