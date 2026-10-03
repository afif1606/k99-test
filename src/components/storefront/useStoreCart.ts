import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicMenuItem } from '../../types';

const CART_KEY = 'k99_store_cart_v1';
const MAX_QTY = 99;

interface CartLine {
  id: string;
  qty: number;
}

export interface StoreCartItem {
  item: PublicMenuItem;
  qty: number;
  subtotal: number;
}

function loadLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.id === 'string' && Number(l.qty) >= 1)
      .map((l) => ({ id: l.id as string, qty: Math.min(MAX_QTY, Math.floor(Number(l.qty))) }));
  } catch {
    return [];
  }
}

/**
 * Keranjang pelanggan. Hanya menyimpan {id, qty} di localStorage supaya nama & harga
 * selalu mengikuti menu terbaru dari server; item yang sudah tidak tersedia otomatis dibuang.
 */
export function useStoreCart(menu: PublicMenuItem[] | null) {
  const [lines, setLines] = useState<CartLine[]>(loadLines);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      /* penyimpanan penuh / mode privat: keranjang tetap jalan di memori */
    }
  }, [lines]);

  // Buang item yang sudah tidak ada di menu (hanya bila menu benar-benar sudah dimuat & tidak kosong)
  useEffect(() => {
    if (!menu || menu.length === 0) return;
    const ids = new Set(menu.map((m) => m.id));
    setLines((prev) => (prev.every((l) => ids.has(l.id)) ? prev : prev.filter((l) => ids.has(l.id))));
  }, [menu]);

  const items: StoreCartItem[] = useMemo(() => {
    if (!menu) return [];
    const byId = new Map(menu.map((m) => [m.id, m] as const));
    const out: StoreCartItem[] = [];
    for (const l of lines) {
      const item = byId.get(l.id);
      if (item) out.push({ item, qty: l.qty, subtotal: item.price * l.qty });
    }
    return out;
  }, [lines, menu]);

  const itemCount = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.subtotal, 0);

  const qtyOf = useCallback((id: string) => lines.find((l) => l.id === id)?.qty ?? 0, [lines]);

  const add = useCallback((id: string) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (!found) return [...prev, { id, qty: 1 }];
      return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l));
    });
  }, []);

  const decrease = useCallback((id: string) => {
    setLines((prev) =>
      prev.flatMap((l) => (l.id !== id ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []))
    );
  }, []);

  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  return { items, itemCount, total, qtyOf, add, decrease, remove, clear };
}

export type StoreCart = ReturnType<typeof useStoreCart>;
