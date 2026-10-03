import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

export default function ProductPhotos({ multiple = false, editing = false }) {
  const id = useId();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const title = multiple ? 'Detail images (up to 5)' : 'Cover image';

  useEffect(() => {
    const images = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviews(images);
    return () => images.forEach((image) => URL.revokeObjectURL(image.url));
  }, [files]);

  return (
    <div className="photo-field">
      <label
        htmlFor={id}
        className="photo-upload"
      >
        <span className="photo-upload-title">
          <ImagePlus size={22} /> {title}
        </span>
        <span className="photo-upload-hint">
          {editing
            ? multiple
              ? 'Choose photos to replace all saved detail images, or leave empty to keep them.'
              : 'Choose a new cover image, or leave empty to keep the current one.'
            : multiple
              ? 'Show the details, texture, and inside of your wallet.'
              : 'Choose your best photo for the product details.'}
        </span>
        <input
          id={id}
          ref={inputRef}
          aria-label={title}
          name={multiple ? 'images' : 'coverImage'}
          type="file"
          accept="image/*"
          multiple={multiple}
          required={!multiple && !editing}
          onChange={(event) => {
            const selected = [...event.target.files];
            const message =
              selected.length > 5 ? 'Choose up to five detail images.' : '';
            event.target.setCustomValidity(message);
            setError(message);
            setFiles(selected.slice(0, 5));
          }}
        />
      </label>
      {error && (
        <p
          className="error"
          role="alert"
        >
          {error}
        </p>
      )}
      {!!previews.length && (
        <>
          <div className="photo-previews">
            {previews.map((image) => (
              <img
                key={image.url}
                src={image.url}
                alt={`Selected photo: ${image.name}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="photo-clear"
            onClick={() => {
              inputRef.current.value = '';
              inputRef.current.setCustomValidity('');
              setFiles([]);
              setError('');
            }}
          >
            <X size={16} /> {multiple ? 'Clear photos' : 'Remove photo'}
          </button>
        </>
      )}
    </div>
  );
}
