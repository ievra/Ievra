/**
 * Compress image only if > 10 MB.
 * Target: under 10 MB, quality 0.92, original dimensions preserved (no resize).
 * Files already ≤ 10 MB are returned as-is — zero quality loss.
 */
export async function compressIfNeeded(file: File): Promise<{ blob: Blob; didCompress: boolean }> {
  const TEN_MB = 10 * 1024 * 1024;

  if (file.size <= TEN_MB) {
    return { blob: file, didCompress: false };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, didCompress: true });
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.92,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}
