import { useState, useRef, useEffect, useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
  placeholder?: string;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  'data-testid'?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const SRCSET_WIDTHS = [640, 960, 1280, 1920];

function toImgUrl(src: string, width?: number, lqip = false): string {
  if (!src || !src.startsWith('/api/assets/')) return src;
  const assetPath = src.replace('/api/assets/', '');
  const params = new URLSearchParams();
  if (lqip) params.set('lqip', '1');
  else if (width) params.set('w', String(width));
  return `/api/img/${assetPath}?${params.toString()}`;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  wrapperClassName = '',
  priority = false,
  sizes = '(max-width: 640px) 640px, (max-width: 960px) 960px, (max-width: 1280px) 1280px, 1920px',
  objectFit = 'cover',
  'data-testid': testId,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isApiAsset = !!src?.startsWith('/api/assets/');

  const lqipSrc = useMemo(
    () => (isApiAsset ? toImgUrl(src, undefined, true) : undefined),
    [src, isApiAsset]
  );

  const optimizedSrc = useMemo(
    () => (isApiAsset ? toImgUrl(src, 1920) : src),
    [src, isApiAsset]
  );

  const srcSet = useMemo(() => {
    if (!isApiAsset) return undefined;
    return SRCSET_WIDTHS.map(w => `${toImgUrl(src, w)} ${w}w`).join(', ');
  }, [src, isApiAsset]);

  useEffect(() => {
    if (priority) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px', threshold: 0 }
    );
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const aspectRatio = width && height ? height / width : undefined;

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={{ aspectRatio: aspectRatio ? `${width}/${height}` : undefined }}
    >
      {/* LQIP blur-up — shown while full image is loading */}
      {isInView && lqipSrc && !isLoaded && !hasError && (
        <img
          src={lqipSrc}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-${objectFit}`}
          style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }}
        />
      )}

      {/* Spinner fallback for non-asset images */}
      {!isApiAsset && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-black animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center text-gray-400">
          <div className="text-sm">Image unavailable</div>
        </div>
      )}

      {/* Full image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className={`transition-opacity duration-500 object-${objectFit} w-full h-full ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          data-testid={testId}
        />
      )}
    </div>
  );
}
