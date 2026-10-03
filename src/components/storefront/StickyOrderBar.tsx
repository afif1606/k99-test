import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatRupiah } from '../../utils/storefront';

interface StickyOrderBarProps {
  isOpen: boolean;
  opensAt: string;
  itemCount: number;
  total: number;
  onOpenCart: () => void;
  onBrowse: () => void;
}

export const StickyOrderBar: React.FC<StickyOrderBarProps> = ({
  isOpen,
  opensAt,
  itemCount,
  total,
  onOpenCart,
  onBrowse,
}) => {
  const hasItems = itemCount > 0;
  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {!isOpen && !hasItems ? (
        <div className="pointer-events-auto rounded-2xl bg-[#6B5441] px-5 py-4 text-center text-sm font-semibold text-white shadow-xl">
          Kedai sedang tutup{opensAt ? ` · buka ${opensAt}` : ''}
        </div>
      ) : (
        <button
          type="button"
          onClick={hasItems ? onOpenCart : onBrowse}
          className="sf-press pointer-events-auto flex w-full items-center justify-between gap-3 rounded-2xl bg-[#2B1B12] px-5 py-4 text-white shadow-[0_16px_34px_-10px_rgba(43,27,18,.8)] hover:bg-[#3A2518]"
        >
          {hasItems ? (
            <>
              <span className="flex items-center gap-3">
                <span key={itemCount} className="sf-pop relative flex h-9 w-9 items-center justify-center rounded-full bg-[#F3C98B] text-[#2B1B12]">
                  <ShoppingBag className="h-[18px] w-[18px]" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#2B1B12]">
                    {itemCount}
                  </span>
                </span>
                <span className="text-left text-sm font-bold leading-tight">
                  Lihat Keranjang
                  <span className="block text-[11px] font-medium text-white/65">{itemCount} item</span>
                </span>
              </span>
              <span className="text-[15px] font-bold tabular-nums">{formatRupiah(total)}</span>
            </>
          ) : (
            <span className="w-full text-center text-sm font-bold tracking-wide">PESAN SEKARANG</span>
          )}
        </button>
      )}
    </div>
  );
};
