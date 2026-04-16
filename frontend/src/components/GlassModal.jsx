import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function GlassModal({
  open,
  onClose,
  children,
  panelClassName = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
  disableClose = false,
}) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = Math.max(window.innerWidth - documentElement.clientWidth, 0);

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEscape || disableClose || typeof window === 'undefined') return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeOnEscape, disableClose, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="linkedu-modal-overlay"
      onMouseDown={(event) => {
        if (!closeOnBackdrop || disableClose) return;
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="linkedu-modal-backdrop" />
      <div className={`linkedu-modal-shell ${panelClassName}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );
}
