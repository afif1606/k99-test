import { useEffect, useSyncExternalStore } from 'react';
import type { OnlineOrder, OnlineOrderStatus } from '../types';
import { googleSheetsService } from './googleSheetsService';
import { fetchOnlineOrders, setOnlineOrderStatus } from './storefrontService';

/**
 * Penyimpanan bersama (singleton) untuk Pesanan Online di dashboard.
 * Dipakai oleh halaman "Pesanan Online" dan lencana di Navbar, sehingga hanya
 * ada SATU polling ke Apps Script. Polling aktif selama ada komponen yang memakainya.
 */
export interface OnlineOrdersSnapshot {
  orders: OnlineOrder[];
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
}

// Halaman "Pesanan Online" terbuka -> cek tiap 20 dtk; hanya lencana di Navbar -> tiap 2 menit
// (menjaga kuota eksekusi harian Google Apps Script).
const POLL_FAST_MS = 20000;
const POLL_SLOW_MS = 120000;

let snapshot: OnlineOrdersSnapshot = { orders: [], loading: false, error: null, lastLoadedAt: null };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight = false;
let fastViewers = 0;

function emit(next: Partial<OnlineOrdersSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((l) => l());
}

export async function refreshOnlineOrders(): Promise<void> {
  if (inflight || !googleSheetsService.getConfig().webAppUrl) return;
  inflight = true;
  if (snapshot.lastLoadedAt === null) emit({ loading: true });
  try {
    const orders = await fetchOnlineOrders();
    emit({ orders, loading: false, error: null, lastLoadedAt: Date.now() });
  } catch (err) {
    emit({ loading: false, error: err instanceof Error ? err.message : String(err) });
  } finally {
    inflight = false;
  }
}

/** Ubah status dengan update instan di layar; dibatalkan bila server menolak. */
export async function changeOrderStatus(id: string, status: OnlineOrderStatus): Promise<void> {
  const before = snapshot.orders;
  emit({ orders: before.map((o) => (o.id === id ? { ...o, status } : o)) });
  try {
    await setOnlineOrderStatus(id, status);
  } catch (err) {
    emit({ orders: before });
    throw err;
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (listeners.size === 0) return;
  timer = setTimeout(async () => {
    if (document.visibilityState === 'visible') await refreshOnlineOrders();
    schedule();
  }, fastViewers > 0 ? POLL_FAST_MS : POLL_SLOW_MS);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) {
    void refreshOnlineOrders();
    schedule();
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => snapshot;

/** `fast`: true di halaman Pesanan Online (polling lebih sering + muat ulang saat tab kembali aktif) */
export function useOnlineOrders(fast = false): OnlineOrdersSnapshot {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (!fast) return;
    fastViewers++;
    void refreshOnlineOrders();
    schedule();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshOnlineOrders();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      fastViewers--;
      schedule();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fast]);
  return snap;
}
