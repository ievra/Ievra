/**
 * Proxy an image through images.weserv.nl to resize & convert to WebP.
 * - Reduces hero images from 5-20 MB → ~150-400 KB
 * - Reduces card images from 2-10 MB → ~50-150 KB
 * - Falls back to original src for base64 data URIs (can't be proxied)
 */
export function imgUrl(
  src: string | null | undefined,
  opts?: {
    w?: number;
    h?: number;
    q?: number;
    fit?: 'cover' | 'contain' | 'inside' | 'outside' | 'fill';
  }
): string {
  if (!src) return '';
  if (src.startsWith('data:')) return src;

  const { w, h, q = 82, fit = 'cover' } = opts || {};

  let fullUrl: string;
  if (src.startsWith('http')) {
    fullUrl = src;
  } else {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    fullUrl = `${origin}${src}`;
  }

  const stripped = fullUrl.replace(/^https?:\/\//, '');
  const params = new URLSearchParams({ url: stripped });
  if (w) params.set('w', String(w));
  if (h) params.set('h', String(h));
  params.set('q', String(q));
  if (w || h) params.set('fit', fit);
  params.set('output', 'webp');

  return `https://images.weserv.nl/?${params.toString()}`;
}
