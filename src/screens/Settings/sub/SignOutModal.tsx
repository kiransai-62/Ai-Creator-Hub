import { useEffect, useRef } from 'react';
import { Button } from '../../../components/Button/Button';
import { LogOut } from 'lucide-react';
import '../SettingsSubScreens.css';

export function SignOutModal({ onCancel, onConfirm }: { onCancel: () => void, onConfirm: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement;

    // Focus Cancel button initially
    const focusTimer = setTimeout(() => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
    };
  }, [onCancel]);

  return (
    <div className="modal-overlay glass-overlay">
      <div 
        ref={modalRef} 
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
      >
        <div className="modal-icon-wrapper danger-glow">
          <LogOut size={28} className="text-danger" />
        </div>
        <h3 id="signout-modal-title" className="modal-title">Sign Out</h3>
        <p className="modal-desc">Are you sure you want to end your session? You will need to log in again to access your library.</p>
        <div className="modal-actions">
          <Button variant="outline" onClick={onCancel} className="flex-1 btn-cancel">Cancel</Button>
          <Button variant="primary" onClick={onConfirm} className="flex-1 btn-danger">Log Out</Button>
        </div>
      </div>
    </div>
  );
}
