import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Coffee, RefreshCw } from 'lucide-react';
import { getPublicStore, type PublicStoreData } from '../../services/storefrontService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { hoursLabel } from '../../utils/storefront';
import { StoreHeader } from './StoreHeader';
import { HeroSection } from './HeroSection';
import { FeaturedMenu, FullMenu } from './MenuSections';
import { AboutSection, LocationSection, StoreFooter } from './InfoSections';
import { StickyOrderBar } from './StickyOrderBar';
import { CartSheet } from './CartSheet';
import { CheckoutSheet, OrderSuccessSheet, type OrderSuccess } from './CheckoutSheet';
import { useStoreCart } from './useStoreCart';
import { STOREFRONT_CSS, STOREFRONT_FONTS_HREF } from './storefrontStyles';

const REFRESH_MS = 20000;
type Sheet = 'none' | 'cart' | 'checkout' | 'success';

/**
 * Halaman publik /store (tanpa login, tanpa AppProvider -> tidak menyentuh data & sinkronisasi POS).
 * Status buka/tutup dan menu dimuat ulang tiap 20 detik dan saat tab kembali aktif.
 */
export const StorefrontPage: React.FC = () => {
  const [data, setData] = useState<PublicStoreData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<Sheet>('none');
  const [success, setSuccess] = useState<OrderSuccess | null>(null);
  const cart = useStoreCart(data ? data.menu : null);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const next = await getPublicStore();
      setData(next);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat toko.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && void load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  // Font + gaya halaman + judul tab (dibersihkan saat halaman ditinggalkan)
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-storefront', 'true');
    style.textContent = STOREFRONT_CSS;
    document.head.appendChild(style);
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = STOREFRONT_FONTS_HREF;
    document.head.appendChild(font);
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#FBF7F1';
    document.head.appendChild(meta);
    return () => {
      style.remove();
      font.remove();
      meta.remove();
    };
  }, []);

  useEffect(() => {
    if (data?.store.storeName) document.title = `${data.store.storeName} · Pesan Online`;
  }, [data?.store.storeName]);

  const scrollToMenu = useCallback(() => {
    document.getElementById('sf-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const closeSheet = useCallback(() => setSheet('none'), []);

  const shell = (children: React.ReactNode) => (
    <div className="sf-root min-h-screen bg-[#EDE3D3] text-[#2B1B12]">
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-[#FBF7F1] shadow-[0_0_60px_-20px_rgba(43,27,18,.45)]">
        {children}
      </div>
    </div>
  );

  // --- Belum ada data ---
  if (!data) {
    if (loading) {
      return shell(
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-[#8A7360]">
          <Coffee className="sf-float h-10 w-10 text-[#B0763A]" />
          <p className="text-sm font-semibold">Menyiapkan menu...</p>
        </div>
      );
    }
    return shell(
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <AlertTriangle className="h-10 w-10 text-[#B0763A]" />
        <div>
          <p className="sf-display text-xl font-bold">Toko belum bisa dibuka</p>
          <p className="mt-2 text-sm leading-relaxed text-[#7A6551]">
            {googleSheetsService.getConfig().webAppUrl
              ? loadError || 'Terjadi kesalahan saat memuat menu.'
              : 'Toko online belum dikonfigurasi oleh pemilik kedai.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="sf-press inline-flex items-center gap-2 rounded-full bg-[#2B1B12] px-5 py-3 text-sm font-bold text-white"
        >
          <RefreshCw className="h-4 w-4" /> Coba lagi
        </button>
      </div>
    );
  }

  const { store, menu } = data;
  const canOrder = store.isOpen;
  const closedMessage = store.openingTime
    ? `Kedai sedang tutup. Buka kembali ${store.openingTime} WIB.`
    : 'Kedai sedang tutup. Silakan pesan saat kami buka.';

  return shell(
    <>
      <StoreHeader store={store} />
      {loadError && (
        <p className="bg-amber-50 px-4 py-2 text-center text-[11px] font-semibold text-amber-800">
          Koneksi bermasalah, menampilkan data terakhir. Mencoba lagi...
        </p>
      )}

      <main className="pb-36">
        <HeroSection store={store} onOrderNow={scrollToMenu} />
        <FeaturedMenu menu={menu} cart={cart} canOrder={canOrder} />
        <FullMenu menu={menu} cart={cart} canOrder={canOrder} />
        <AboutSection store={store} />
        <LocationSection store={store} />
        <StoreFooter store={store} />
      </main>

      <StickyOrderBar
        isOpen={store.isOpen}
        opensAt={hoursLabel(store) ? store.openingTime : ''}
        itemCount={cart.itemCount}
        total={cart.total}
        onOpenCart={() => setSheet('cart')}
        onBrowse={scrollToMenu}
      />

      {sheet === 'cart' && (
        <CartSheet
          cart={cart}
          canOrder={canOrder}
          closedMessage={closedMessage}
          onClose={closeSheet}
          onCheckout={() => setSheet('checkout')}
        />
      )}
      {sheet === 'checkout' && (
        <CheckoutSheet
          store={store}
          cart={cart}
          onBack={() => setSheet('cart')}
          onClose={closeSheet}
          onStoreChanged={() => void load()}
          onSuccess={(result) => {
            setSuccess(result);
            setSheet('success');
          }}
        />
      )}
      {sheet === 'success' && success && <OrderSuccessSheet result={success} onClose={closeSheet} />}
    </>
  );
};

export default StorefrontPage;
