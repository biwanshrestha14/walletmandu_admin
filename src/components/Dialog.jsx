import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export default function Dialog({ title, onClose, children, drawer = false }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    document.body.style.overflow = 'hidden';
    dialog.showModal();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElement?.focus();
    };
  }, []);

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={drawer ? 'dialog drawer' : 'dialog'}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="dialog-inner">
        <div className="dialog-heading">
          <h2 id={titleId}>{title}</h2>

          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
        </div>

        {children}
      </div>
    </dialog>
  );
}
