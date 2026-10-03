import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatRupiah } from '../../utils/storefront';
import { BottomSheet } from './BottomSheet';
import { WhatsAppIcon } from './icons';
import type { StoreCart } from './useStoreCart';

interface CartSheetProps {
  cart: StoreCart;
  canOrder: boolean;
  closedMessage: string;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartSheet: React.FC<CartSheetProps> = ({ cart, canOrder, closedMessage, onClose, onCheckout }) => {
  const empty = cart.items.length === 0;
  return (
    <BottomSheet
      title="Keranjang"
      onClose={onClose}
      footer={
        empty ? null : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#6B5441]">Total</span>
              <span className="sf-display text-[24px] font-bold text-[#2B1B12]">{formatRupiah(cart.total)}</span>
            </div>
            {!canOrder && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700">
                {closedMessage}
              </p>
            )}
            <button
              type="button"
              disabled={!canOrder}
              onClick={onCheckout}
              className="sf-press flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F9D55] px-5 py-4 text-sm font-bold text-white shadow-lg hover:bg-[#188346] disabled:cursor-not-allowed disabled:bg-[#B9B0A5] disabled:shadow-none"
            >
              <WhatsAppIcon className="h-5 w-5" /> Checkout WhatsApp
            </button>
          </div>
        )
      }
    >
      {empty ? (
        <p className="py-14 text-center text-sm text-[#8A7360]">Keranjang masih kosong. Yuk pilih menu favoritmu!</p>
      ) : (
        <ul className="divide-y divide-[#EADFCF]">
          {cart.items.map(({ item, qty, subtotal }) => (
            <li key={item.id} className="flex items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-[#2B1B12]">{item.name}</p>
                <p className="mt-0.5 text-xs text-[#7A6551]">
                  {qty} x {formatRupiah(item.price)}
                </p>
                <p className="mt-1 text-sm font-bold text-[#9A5A1E]">{formatRupiah(subtotal)}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => cart.decrease(item.id)}
                  className="sf-press flex h-8 w-8 items-center justify-center rounded-full text-[#2B1B12] hover:bg-[#F1E7D8]"
                  aria-label={`Kurangi ${item.name}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => cart.add(item.id)}
                  className="sf-press flex h-8 w-8 items-center justify-center rounded-full text-[#2B1B12] hover:bg-[#F1E7D8]"
                  aria-label={`Tambah ${item.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => cart.remove(item.id)}
                className="sf-press flex h-9 w-9 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
                aria-label={`Hapus ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
};
