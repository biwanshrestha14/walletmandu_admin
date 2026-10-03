import { useState } from 'react';
import { ImageOff } from 'lucide-react';

function ProductImage({ url, label }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed)
    return (
      <span
        className="product-image-missing"
        role="img"
        aria-label={`${label}: unavailable`}
      >
        <ImageOff size={22} />
        <span>No image</span>
      </span>
    );
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${label}`}
    >
      <img
        src={url}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

export default function ProductGallery({ product, compact = false }) {
  const details = [...(product.images || [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  return (
    <div className={`product-gallery ${compact ? 'is-compact' : ''}`}>
      <div className="product-gallery-group">
        <span className="gallery-label">
          {product.featuredimage ? 'Cover · Featured' : 'Cover image'}
        </span>
        <div className="saved-photo-grid">
          <ProductImage
            key={product.coverImageUrl || 'cover'}
            url={product.coverImageUrl}
            label={`${product.name} cover image`}
          />
        </div>
      </div>
      <div className="product-gallery-group">
        <span className="gallery-label">
          Detail images{details.length ? ` · ${details.length}` : ''}
        </span>
        {details.length ? (
          <div className="saved-photo-grid">
            {details.map((photo, index) => (
              <ProductImage
                key={photo.id || photo.url}
                url={photo.url}
                label={`${product.name} detail image ${index + 1}`}
              />
            ))}
          </div>
        ) : (
          <p className="gallery-empty">No detail photos yet.</p>
        )}
      </div>
    </div>
  );
}
