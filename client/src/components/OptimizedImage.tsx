import { useState, useRef, useEffect } from 'react';

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

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  wrapperClassName = '',
  priority = false,
  placeholder,
  sizes = '100vw',
  objectFit = 'cover',
  'data-testid': testId,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1
      }
    );

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    console.error('❌ Failed to load image:', src);
    setHasError(true);
    onError?.();
  };

  // Generate optimized image URL with responsive srcSet
  const getOptimizedSrc = (originalSrc: string, targetWidth?: number) => {
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      if (targetWidth) url.searchParams.set('w', targetWidth.toString());
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'max'); // Better default than crop
      url.searchParams.set('q', '80');
      return url.toString();
    }
    return originalSrc;
  };

  // Generate responsive srcSet for Unsplash images
  const getSrcSet = (originalSrc: string) => {
    if (!originalSrc.includes('unsplash.com')) return undefined;
    
    const breakpoints = [320, 640, 960, 1280, 1920];
    return breakpoints
      .map(w => `${getOptimizedSrc(originalSrc, w)} ${w}w`)
      .join(', ');
  };

  const optimizedSrc = getOptimizedSrc(src, width);
  const srcSet = getSrcSet(src);
  
  // Calculate aspect ratio for space reservation
  const aspectRatio = width && height ? height / width : undefined;

  return (
    <div 
      ref={placeholderRef}
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={{ 
        aspectRatio: aspectRatio ? `${width}/${height}` : undefined 
      }}
    >
      {/* Placeholder/Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-black animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-sm">Image unavailable</div>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          className={`transition-opacity duration-300 object-${objectFit} ${
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