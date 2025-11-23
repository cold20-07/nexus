import { useState } from 'react';

/**
 * OptimizedImage Component
 * Provides lazy loading, blur-up effect, and WebP support with fallbacks
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  priority = false,
  objectFit = 'cover'
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate WebP URL if source is jpg/jpeg/png
  const getWebPSrc = (originalSrc) => {
    if (!originalSrc) return null;
    if (originalSrc.match(/\.(jpg|jpeg|png)$/i)) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return null;
  };

  const webpSrc = getWebPSrc(src);

  // Handle image load error (fallback to original if WebP fails)
  const handleError = () => {
    setError(true);
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  // If no src provided, return placeholder
  if (!src) {
    return (
      <div 
        className={`bg-slate-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-slate-400 text-sm">No image</span>
      </div>
    );
  }

  return (
    <picture className={className}>
      {/* WebP source for modern browsers */}
      {webpSrc && !error && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      
      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        className={`transition-all duration-300 ${loaded ? 'opacity-100' : 'opacity-0 blur-sm'} ${className}`}
        style={{ 
          width, 
          height, 
          objectFit 
        }}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />
    </picture>
  );
};

export default OptimizedImage;
