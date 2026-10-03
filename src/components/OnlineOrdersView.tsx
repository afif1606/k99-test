import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, Smartphone } from 'lucide-react';
import type { OnlineOrder, OnlineOrderStatus } from '../types';
import { formatDateTime, formatIDR } from '../utils/formatters';
import { normalizeWhatsapp, orderNumberLabel, storefrontUrl } from '../utils/storefront';
import { googleSheetsService } from '../services/googleSheetsService';
import { changeOrderStatus, refreshOnlineOrders, useOnlineOrders } from '../services/onlineOrdersStore';
import { StoreStatusSwitch } from './StorefrontSettingsCard';

const TABS: { id: OnlineOrderStatus; label: string; empty: string }[] = [
  { id: 'NEW', label: 'Pesanan Baru', empty: 'Belum ada pesanan baru.' },
  { id: 'PROCESSING', label: 'Diproses', empty: 'Tidak ada pesanan yang sedang diproses.' },
  { id: 'READY', label: 'Siap', empty: 'Tidak ada pesanan yang siap diambil.' },
  { id: 'DONE', label: 'Selesai', empty: 'Belum ada pesanan selesai.' },
];

const NEXT: Partial<Record<OnlineOrderStatus, { to: OnlineOrderStatus; label: string; cls: string }>> = {
  NEW: { to: 'PROCESSING', label: 'Terima', cls: 'bg-amber-600 hover:bg-amber-500' },
  PROCESSING: { to: 'READY', label: 'Tandai Siap', cls: 'bg-sky-600 hover:bg-sky-500' },
  READY: { to: 'DONE', label: 'Selesai', cls: 'bg-emerald-600 hover:bg-emerald-500' },
};

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => void ctx.close();
  } catch {
    /* browser memblokir audio: abaikan */
  }
}

const OrderCard: React.FC<{ order: OnlineOrder; busy: boolean; onAdvance: (o: OnlineOrder) => void }> = ({
  order,
  busy,
  onAdvance,
}) => {
  const next = NEXT[order.status];
  const wa = normalizeWhatsapp(order.customerPhone);
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-base font-bold text-white tabular-nums">{orderNumberLabel(order.orderNumber)}</span>
          <span className="block text-neutral-500">{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="text-right">
          <span className="block font-semibold text-white">{order.customerName}</span>
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              {order.customerPhone}
            </a>
          ) : (
            <span className="text-neutral-500">{order.customerPhone}</span>
          )}
        </div>
      </div>

      <ul className="space-y-1 border-y border-neutral-800 py-2.5">
        {order.items.map((it) => (
          <li key={it.menuItemId} className="flex justify-between gap-3 text-neutral-200">
            <span>
              {it.name} <span className="text-neutral-500">x{it.quantity}</span>
            </span>
            <span className="tabular-nums text-neutral-400">{formatIDR(it.subtotal)}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-amber-200">
          Catatan: {order.notes}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-amber-400 text-sm tabular-nums">Total {formatIDR(order.totalAmount)}</span>
        {next && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAdvance(order)}
            className={`px-4 py-2 font-bold text-white rounded-lg transition-colors disabled:opacity-50 ${next.cls}`}
          >
            [{next.label}]
          </button>
        )}
      </div>
    </div>
  );
};

export const OnlineOrdersView: React.FC = () => {
  const { orders, loading, error, lastLoadedAt } = useOnlineOrders(true);
  const [tab, setTab] = useState<OnlineOrderStatus>('NEW');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const hasUrl = !!googleSheetsService.getConfig().webAppUrl;

  const counts = useMemo(() => {
    const c: Record<OnlineOrderStatus, number> = { NEW: 0, PROCESSING: 0, READY: 0, DONE: 0 };
    orders.forEach((o) => (c[o.status] += 1));
    return c;
  }, [orders]);

  // Bunyi saat ada pesanan baru setelah pemuatan pertama
  const prevNew = useRef<number | null>(null);
  useEffect(() => {
    if (lastLoadedAt === null) return;
    if (prevNew.current !== null && counts.NEW > prevNew.current) beep();
    prevNew.current = counts.NEW;
  }, [counts.NEW, lastLoadedAt]);

  const shown = orders.filter((o) => o.status === tab);

  const advance = async (order: OnlineOrder) => {
    const next = NEXT[order.status];
    if (!next) return;
    setBusyId(order.id);
    setActionError(null);
    try {
      await changeOrderStatus(order.id, next.to);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal mengubah status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-500" /> Pesanan Online
          </h2>
          <span className="text-xs text-neutral-400">
            Pesanan dari halaman toko online. Diperbarui otomatis tiap 20 detik.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshOnlineOrders()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
          </button>
          <a
            href={storefrontUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Lihat Toko
          </a>
        </div>
      </div>

      <StoreStatusSwitch compact />

      {!hasUrl && (
        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Hubungkan Google Sheets terlebih dahulu (tombol Google Sheets di atas) agar pesanan online dapat diterima.
        </div>
      )}
      {(error || actionError) && (
        <div className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {actionError || error}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap border ${
              tab === t.id
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            {t.label}
            <span
              className={`px-1.5 rounded text-[10px] font-bold tabular-nums ${
                t.id === 'NEW' && counts.NEW > 0 ? 'bg-white text-amber-700' : 'bg-black/30 text-neutral-300'
              }`}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-500">Memuat pesanan...</p>
      ) : shown.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-500">{TABS.find((t) => t.id === tab)?.empty}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shown.map((o) => (
            <OrderCard key={o.id} order={o} busy={busyId === o.id} onAdvance={advance} />
          ))}
        </div>
      )}
    </div>
  );
};
