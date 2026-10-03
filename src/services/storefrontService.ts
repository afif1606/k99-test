import { googleSheetsService } from './googleSheetsService';
import type {
  OnlineOrder,
  OnlineOrderItem,
  OnlineOrderStatus,
  PublicMenuItem,
  PublicStoreInfo,
} from '../types';

/**
 * Akses ke Google Apps Script untuk etalase online.
 * - Sisi publik (pelanggan): getPublicStore, submitOnlineOrder
 * - Sisi admin (dashboard): fetchOnlineOrders, setOnlineOrderStatus
 * URL Apps Script diambil dari konfigurasi yang sama dengan sinkronisasi POS
 * (di HP pelanggan otomatis dari variabel build VITE_GAS_URL).
 */

const OLD_SCRIPT_HINT =
  'Kode Apps Script belum diperbarui. Salin kode terbaru dari menu Google Sheets di POS, tempel di Apps Script, lalu Deploy > Kelola penerapan > Edit > Versi baru.';

export class StorefrontError extends Error {
  code: string;
  constructor(message: string, code = 'ERROR') {
    super(message);
    this.code = code;
  }
}

function scriptUrl(): string {
  return googleSheetsService.getConfig().webAppUrl;
}

async function request(init: { method: 'GET'; query: string } | { method: 'POST'; body: unknown }, timeoutMs = 20000) {
  const base = scriptUrl();
  if (!base) throw new StorefrontError('Toko online belum dikonfigurasi.', 'NO_URL');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res =
      init.method === 'GET'
        ? await fetch(`${base}${base.includes('?') ? '&' : '?'}${init.query}`, { redirect: 'follow', signal: ctrl.signal })
        : await fetch(base, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(init.body),
            redirect: 'follow',
            signal: ctrl.signal,
          });
    if (!res.ok) throw new StorefrontError(`Server error (HTTP ${res.status})`, 'HTTP');
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new StorefrontError('Balasan server tidak valid.', 'BAD_JSON');
    }
  } catch (err) {
    if (err instanceof StorefrontError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new StorefrontError('Koneksi terlalu lama. Coba lagi.', 'TIMEOUT');
    }
    throw new StorefrontError('Tidak bisa terhubung ke server. Periksa koneksi internet.', 'NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

function fail(json: Record<string, unknown>, fallback: string): never {
  const msg = String(json.message || '');
  throw new StorefrontError(/tidak dikenal/i.test(msg) ? OLD_SCRIPT_HINT : msg || fallback, String(json.code || 'ERROR'));
}

// ---------------------------------------------------------------------------
// Publik
// ---------------------------------------------------------------------------
export interface PublicStoreData {
  store: PublicStoreInfo;
  menu: PublicMenuItem[];
}

export async function getPublicStore(): Promise<PublicStoreData> {
  const json = await request({ method: 'GET', query: 'action=get_public_store' });
  if (json.status !== 'success') fail(json, 'Gagal memuat menu.');
  return { store: json.store as PublicStoreInfo, menu: (json.menu as PublicMenuItem[]) || [] };
}

export interface SubmitOrderInput {
  customerName: string;
  customerPhone: string;
  notes: string;
  items: { menuItemId: string; quantity: number }[];
}

/** Simpan pesanan ke dashboard. Harga dihitung ulang oleh server. */
export async function submitOnlineOrder(input: SubmitOrderInput): Promise<OnlineOrder> {
  const json = await request({ method: 'POST', body: { action: 'create_online_order', ...input } }, 25000);
  if (json.status !== 'success') fail(json, 'Gagal mengirim pesanan.');
  return json.order as OnlineOrder;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export async function fetchOnlineOrders(): Promise<OnlineOrder[]> {
  const json = await request({ method: 'POST', body: { action: 'list_online_orders' } });
  if (json.status !== 'success') fail(json, 'Gagal memuat pesanan online.');
  return ((json.orders as OnlineOrder[]) || []).map(normalizeOrder);
}

export async function setOnlineOrderStatus(id: string, status: OnlineOrderStatus): Promise<void> {
  const json = await request({ method: 'POST', body: { action: 'update_online_order_status', id, status } });
  if (json.status !== 'success') fail(json, 'Gagal mengubah status pesanan.');
}

function normalizeOrder(o: OnlineOrder): OnlineOrder {
  const items: OnlineOrderItem[] = Array.isArray(o.items) ? o.items : [];
  return { ...o, items, notes: o.notes || '' };
}
