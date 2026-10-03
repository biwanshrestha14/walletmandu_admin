import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function ProductActions({ name, children }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div
      className="product-actions"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="icon-button product-actions-trigger"
        ref={trigger}
        aria-label={`Actions for ${name}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal size={20} />
      </button>
      <div
        className={`table-actions product-actions-options ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(false)}
      >
        {children}
      </div>
    </div>
  );
}
