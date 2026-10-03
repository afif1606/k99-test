import React, { useState } from 'react';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';
import type { OnlineOrder } from '../../types';
import { submitOnlineOrder, StorefrontError } from '../../services/storefrontService';
import {
  buildWhatsappMessage,
  formatRupiah,
  isValidPhone,
  normalizeWhatsapp,
  orderNumberLabel,
  whatsappUrl,
} from '../../utils/storefront';
import type { PublicStoreInfo } from '../../types';
import { BottomSheet } from './BottomSheet';
import { WhatsAppIcon } from './icons';
import type { StoreCart } from './useStoreCart';

const CUSTOMER_KEY = 'k99_store_customer_v1';

/** Kode galat yang berarti pesanan DITOLAK server (bukan masalah jaringan) */
const REJECTED_CODES = new Set(['CLOSED', 'INVALID', 'UNAVAILABLE', 'NOT_READY']);

export interface OrderSuccess {
  orderNumber?: number;
  saved: boolean;
  waUrl: string;
}

interface CheckoutSheetProps {
  store: PublicStoreInfo;
  cart: StoreCart;
  onBack: () => void;
  onClose: () => void;
  onSuccess: (result: OrderSuccess) => void;
  /** menu/status berubah di server (mis. kedai baru saja tutup) -> muat ulang */
  onStoreChanged: () => void;
}

function loadCustomer(): { name: string; phone: string } {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return { name: String(p.name || ''), phone: String(p.phone || '') };
  } catch {
    return { name: '', phone: '' };
  }
}

const inputCls =
  'w-full rounded-2xl border border-[#E3D5C0] bg-white px-4 py-3.5 text-[15px] text-[#2B1B12] placeholder:text-[#B5A38E] focus:border-[#9A5A1E] focus:outline-none focus:ring-2 focus:ring-[#F3C98B]';

export const CheckoutSheet: React.FC<CheckoutSheetProps> = ({
  store,
  cart,
  onBack,
  onClose,
  onSuccess,
  onStoreChanged,
}) => {
  const saved = React.useMemo(loadCustomer, []);
  const [name, setName] = useState(saved.name);
  const [phone, setPhone] = useState(saved.phone);
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waTarget = store.whatsappNumber || store.phone;
  const nameError = !name.trim() ? 'Nama wajib diisi' : '';
  const phoneError = !phone.trim() ? 'Nomor WhatsApp wajib diisi' : !isValidPhone(phone) ? 'Nomor WhatsApp tidak valid' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setTouched(true);
    setError(null);
    if (nameError || phoneError) return;
    if (!normalizeWhatsapp(waTarget)) {
      setError('Nomor WhatsApp kedai belum diatur. Silakan hubungi kedai secara langsung.');
      return;
    }
    if (cart.items.length === 0) {
      setError('Keranjang kosong.');
      return;
    }

    setSubmitting(true);
    let order: OnlineOrder | null = null;
    try {
      order = await submitOnlineOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        notes: notes.trim(),
        items: cart.items.map((i) => ({ menuItemId: i.item.id, quantity: i.qty })),
      });
    } catch (err) {
      if (err instanceof StorefrontError && REJECTED_CODES.has(err.code)) {
        setError(err.message);
        setSubmitting(false);
        if (err.code !== 'INVALID') onStoreChanged();
        return;
      }
      // Masalah jaringan/server: pelanggan tetap bisa memesan lewat WhatsApp (tanpa nomor pesanan)
      order = null;
    }

    const lines = order
      ? order.items.map((i) => ({ name: i.name, quantity: i.quantity, subtotal: i.subtotal }))
      : cart.items.map((i) => ({ name: i.item.name, quantity: i.qty, subtotal: i.subtotal }));
    const message = buildWhatsappMessage({
      storeName: store.storeName,
      items: lines,
      total: order ? order.totalAmount : cart.total,
      customerName: name.trim(),
      notes,
      orderNumber: order?.orderNumber,
    });
    const waUrl = whatsappUrl(waTarget, message);

    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }));
    } catch {
      /* abaikan */
    }
    cart.clear();
    onSuccess({ orderNumber: order?.orderNumber, saved: !!order, waUrl });
    window.location.assign(waUrl);
  };

  return (
    <BottomSheet
      title="Data Pemesan"
      onClose={onClose}
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B5441]">
              Total · {cart.itemCount} item
            </span>
            <span className="sf-display text-[22px] font-bold text-[#2B1B12]">{formatRupiah(cart.total)}</span>
          </div>
          <button
            type="submit"
            form="sf-checkout-form"
            disabled={submitting}
            className="sf-press flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F9D55] px-5 py-4 text-sm font-bold text-white shadow-lg hover:bg-[#188346] disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Mengirim pesanan...
              </>
            ) : (
              <>
                <WhatsAppIcon className="h-5 w-5" /> Kirim Pesanan
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="w-full py-1 text-center text-xs font-semibold text-[#8A7360] hover:text-[#2B1B12]"
          >
            ← Kembali ke keranjang
          </button>
        </div>
      }
    >
      <form id="sf-checkout-form" onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
        <div>
          <label htmlFor="sf-name" className="mb-1.5 block text-xs font-bold text-[#6B5441]">
            Nama pelanggan
          </label>
          <input
            id="sf-name"
            type="text"
            autoComplete="name"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className={inputCls}
          />
          {touched && nameError && <p className="mt-1 text-xs font-semibold text-rose-600">{nameError}</p>}
        </div>
        <div>
          <label htmlFor="sf-phone" className="mb-1.5 block text-xs font-bold text-[#6B5441]">
            Nomor WhatsApp
          </label>
          <input
            id="sf-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            className={inputCls}
          />
          {touched && phoneError && <p className="mt-1 text-xs font-semibold text-rose-600">{phoneError}</p>}
        </div>
        <div>
          <label htmlFor="sf-notes" className="mb-1.5 block text-xs font-bold text-[#6B5441]">
            Catatan pesanan <span className="font-medium text-[#A8977F]">(opsional)</span>
          </label>
          <textarea
            id="sf-notes"
            rows={3}
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mis. less sugar, es dipisah, ambil jam 3"
            className={`${inputCls} resize-none`}
          />
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-[#8A7360]">
          Pesanan akan dikirim ke WhatsApp kedai untuk dikonfirmasi. Pembayaran dilakukan langsung dengan kedai.
        </p>
      </form>
    </BottomSheet>
  );
};

export const OrderSuccessSheet: React.FC<{ result: OrderSuccess; onClose: () => void }> = ({ result, onClose }) => (
  <BottomSheet title="Pesanan Terkirim" onClose={onClose}>
    <div className="flex flex-col items-center py-6 text-center">
      <span className="sf-pop flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Check className="h-8 w-8" />
      </span>
      {result.orderNumber ? (
        <p className="sf-display mt-4 text-3xl font-bold text-[#2B1B12]">{orderNumberLabel(result.orderNumber)}</p>
      ) : null}
      <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-[#5E4836]">
        {result.saved
          ? 'Pesananmu sudah tercatat. Kirim pesan WhatsApp yang terbuka agar kedai segera memprosesnya.'
          : 'Pesan WhatsApp sudah disiapkan. Tekan kirim di WhatsApp agar kedai menerima pesananmu.'}
      </p>
      <a
        href={result.waUrl}
        className="sf-press mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F9D55] px-5 py-4 text-sm font-bold text-white shadow-lg"
      >
        <WhatsAppIcon className="h-5 w-5" /> Buka WhatsApp lagi
      </a>
      <button type="button" onClick={onClose} className="mt-3 py-2 text-xs font-semibold text-[#8A7360]">
        Kembali ke menu
      </button>
    </div>
  </BottomSheet>
);
