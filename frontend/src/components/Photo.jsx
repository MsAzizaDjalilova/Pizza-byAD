import { useEffect, useRef, useState } from 'react';
import { img } from '../lib/format';

/** Product photo with a blush shimmer placeholder and a soft fade-in. */
export default function Photo({ src, alt, size = 400, className = '', style, eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);

  // Cached images can finish before React attaches onLoad — check on mount/src change.
  useEffect(() => {
    setFailed(false);
    const el = ref.current;
    setLoaded(Boolean(el && el.complete && el.naturalWidth > 0));
  }, [src]);

  return (
    <div className={`photo ${loaded ? 'is-loaded' : ''} ${className}`} style={style}>
      {!failed && src ? (
        <img
          ref={ref}
          src={img(src, size)}
          srcSet={`${img(src, size)} 1x, ${img(src, size * 2)} 2x`}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="photo-fallback">🍕</span>
      )}
    </div>
  );
}
