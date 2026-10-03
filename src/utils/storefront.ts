import type { OnlineOrderItem, PublicStoreInfo } from '../types';

/** Rute publik etalase: /store atau /order (juga #/store untuk hosting tanpa rewrite) */
export function isStorefrontRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  if (path === '/store' || path === '/order') return true;
  const hash = window.location.hash.replace(/\/+$/, '').toLowerCase();
  return hash === '#/store' || hash === '#/order';
}

export function storefrontUrl(): string {
  return typeof window === 'undefined' ? '/store' : `${window.location.origin}/store`;
}

export const formatRupiah = (n: number): string => 'Rp' + Math.round(n || 0).toLocaleString('id-ID');

/** "0812-3456-789" / "+62 812..." -> "62812..." (format wa.me, tanpa tanda +) */
export function normalizeWhatsapp(raw: string): string {
  let d = (raw || '').replace(/[^0-9]/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d;
}

export function isValidPhone(raw: string): boolean {
  const d = normalizeWhatsapp(raw);
  return d.length >= 10 && d.length <= 15;
}

export function instagramHandle(raw: string): string {
  const v = (raw || '').trim();
  if (!v) return '';
  const m = v.match(/instagram\.com\/([^/?#]+)/i);
  return (m ? m[1] : v).replace(/^@/, '');
}

export function mapsLink(store: Pick<PublicStoreInfo, 'mapsUrl' | 'address' | 'storeName'>): string {
  if (/^https?:\/\//i.test(store.mapsUrl)) return store.mapsUrl;
  const q = [store.storeName, store.address].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function hoursLabel(store: Pick<PublicStoreInfo, 'openingTime' | 'closingTime'>): string {
  const { openingTime: o, closingTime: c } = store;
  return o && c ? `${o} - ${c} WIB` : '';
}

export function orderNumberLabel(n: number): string {
  return '#' + String(n).padStart(3, '0');
}

export interface WhatsappMessageInput {
  storeName: string;
  items: Pick<OnlineOrderItem, 'name' | 'quantity' | 'subtotal'>[];
  total: number;
  customerName: string;
  customerPhone?: string;
  notes: string;
  orderNumber?: number;
}

/** Pesan WhatsApp sesuai format yang diminta */
export function buildWhatsappMessage(m: WhatsappMessageInput): string {
  const lines: string[] = [];
  lines.push(`Halo ${m.storeName || 'Kedai Kopi'}`);
  if (m.orderNumber) lines.push(`(Pesanan online ${orderNumberLabel(m.orderNumber)})`);
  lines.push('', 'Saya ingin pesan:', '');
  m.items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.name}`, `${it.quantity} pcs`, formatRupiah(it.subtotal), '');
  });
  lines.push('Total:', formatRupiah(m.total), '');
  lines.push('Nama:', m.customerName, '');
  lines.push('Catatan:', m.notes.trim() || '-');
  return lines.join('\n');
}

export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${normalizeWhatsapp(number)}?text=${encodeURIComponent(message)}`;
}
