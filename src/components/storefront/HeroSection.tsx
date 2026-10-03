import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { PublicStoreInfo } from '../../types';
import { hoursLabel } from '../../utils/storefront';

interface HeroSectionProps {
  store: PublicStoreInfo;
  onOrderNow: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ store, onOrderNow }) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const hasImage = /^https?:\/\//i.test(store.heroImageUrl) && !imgFailed;
  const hours = hoursLabel(store);

  return (
    <section className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-[28px] bg-[#2B1B12] text-white shadow-[0_18px_40px_-18px_rgba(43,27,18,.65)]">
        {hasImage ? (
          <img
            src={store.heroImageUrl}
            alt={`Suasana ${store.storeName}`}
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 85% 15%, #C8803A 0%, transparent 45%), linear-gradient(160deg, #4A2C1A, #2B1B12 70%)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F09] via-[#1A0F09]/55 to-[#1A0F09]/10" />

        {!hasImage && (
          <div className="sf-float absolute right-5 top-6 opacity-90" aria-hidden="true">
            <svg width="86" height="86" viewBox="0 0 86 86" fill="none">
              <path d="M18 40h42v14a16 16 0 0 1-16 16h-10a16 16 0 0 1-16-16V40Z" fill="#F3C98B" />
              <path d="M60 44h6a7 7 0 0 1 0 14h-6" stroke="#F3C98B" strokeWidth="5" strokeLinecap="round" />
              <path className="sf-steam" d="M30 30c-4-5 4-8 0-14" stroke="#F3C98B" strokeWidth="3" strokeLinecap="round" />
              <path className="sf-steam" style={{ animationDelay: '.8s' }} d="M42 30c-4-5 4-8 0-14" stroke="#F3C98B" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        )}

        <div className="relative flex min-h-[340px] flex-col justify-end p-6">
          <p className="sf-fade-up mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F3C98B]">
            {store.tagline || 'Specialty Coffee'}
          </p>
          <h2 className="sf-display sf-fade-up text-[30px] font-bold leading-[1.1]" style={{ animationDelay: '.08s' }}>
            Ngopi lebih mudah,
            <br />
            pesan langsung dari sini
          </h2>
          <p className="sf-fade-up mt-3 text-sm text-white/80" style={{ animationDelay: '.16s' }}>
            {store.isOpen ? 'Saat ini kami buka' : 'Saat ini kami tutup'}
            {hours ? ` · ${hours}` : ''}
          </p>
          <button
            type="button"
            onClick={onOrderNow}
            className="sf-press sf-fade-up mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F3C98B] px-5 py-4 text-sm font-bold tracking-wide text-[#2B1B12] shadow-lg hover:bg-[#F7D6A6]"
            style={{ animationDelay: '.24s' }}
          >
            PESAN SEKARANG
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
