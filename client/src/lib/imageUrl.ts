/**
 * Build an optimised image URL.
 *
 * - /api/assets/... paths  → proxied through our own Sharp endpoint (/api/img)
 *   which converts to WebP, resizes (without upscaling), and caches server-side.
 * - External http(s) URLs  → still routed through images.weserv.nl as fallback.
 * - data: URIs             → returned as-is (can't be proxied).
 *
 * No resolution is reduced unless you pass w smaller than the original.
 * Default quality = 90 (visually lossless for interior design photography).
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

  const { w, q = 90 } = opts || {};

  // Local asset → use our own Sharp proxy (same-server, no external latency)
  if (src.startsWith('/api/assets/')) {
    const params = new URLSearchParams({ src });
    if (w) params.set('w', String(w));
    params.set('q', String(q));
    return `/api/img?${params.toString()}`;
  }

  // External URL → weserv.nl as before
  const { fit = 'cover' } = opts || {};
  const stripped = src.replace(/^https?:\/\//, '');
  const params = new URLSearchParams({ url: stripped });
  if (w) params.set('w', String(w));
  params.set('q', String(q));
  if (w) params.set('fit', fit);
  params.set('output', 'webp');
  return `https://images.weserv.nl/?${params.toString()}`;
}
