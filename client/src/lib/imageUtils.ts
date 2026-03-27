/**
 * No-op: returns the original file as-is.
 * OG images are uploaded directly without canvas recompression
 * to avoid quality loss (especially PNG→JPEG artefacts).
 */
export function compressOgImage(file: File): Promise<Blob> {
  return Promise.resolve(file);
}
