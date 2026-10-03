import React from 'react';
import { Coffee } from 'lucide-react';
import type { PublicStoreInfo } from '../../types';

export const StatusPill: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
      isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
    } ${className}`}
  >
    <span
      className={`h-2 w-2 rounded-full ${isOpen ? 'bg-emerald-500 sf-live-dot' : 'bg-rose-500'}`}
      aria-hidden="true"
    />
    {isOpen ? 'Kedai Sedang Buka' : 'Kedai Sedang Tutup'}
  </span>
);

export const StoreHeader: React.FC<{ store: PublicStoreInfo }> = ({ store }) => {
  const [logoFailed, setLogoFailed] = React.useState(false);
  const showLogo = /^https?:\/\//i.test(store.logoUrl) && !logoFailed;
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#EADFCF] bg-[#FBF7F1]/90 px-4 py-3 backdrop-blur">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2B1B12] text-[#F3C98B]">
        {showLogo ? (
          <img
            src={store.logoUrl}
            alt={`Logo ${store.storeName}`}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <Coffee className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="sf-display truncate text-[17px] font-bold leading-tight text-[#2B1B12]">
          {store.storeName || 'Kedai Kopi'}
        </h1>
        <StatusPill isOpen={store.isOpen} className="mt-0.5 -ml-0.5" />
      </div>
    </header>
  );
};
