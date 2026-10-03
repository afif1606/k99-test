import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Panel geser dari bawah (mobile). Menutup lewat Esc, tap latar, atau tombol X. */
export const BottomSheet: React.FC<BottomSheetProps> = ({ title, onClose, children, footer }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="sf-fade-in absolute inset-0 bg-[#1A0F09]/55"
      />
      <div className="sf-sheet absolute bottom-0 flex max-h-[88vh] w-full max-w-[430px] flex-col rounded-t-[28px] bg-[#FBF7F1] shadow-2xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="sf-display text-[22px] font-bold text-[#2B1B12]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="sf-press flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE7DC] text-[#2B1B12]"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && (
          <div className="border-t border-[#EADFCF] bg-[#FBF7F1] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
