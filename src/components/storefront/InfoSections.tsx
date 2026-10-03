import React from 'react';
import { Clock, ExternalLink, MapPin } from 'lucide-react';
import type { PublicStoreInfo } from '../../types';
import { hoursLabel, instagramHandle, mapsLink, normalizeWhatsapp } from '../../utils/storefront';
import { InstagramIcon, WhatsAppIcon } from './icons';

export const AboutSection: React.FC<{ store: PublicStoreInfo }> = ({ store }) => {
  const text = store.storeDescription.trim();
  if (!text) return null;
  return (
    <section className="mt-10 px-4">
      <div className="rounded-[24px] bg-[#F3E9DA] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B0763A]">Tentang kami</p>
        <h2 className="sf-display mt-1 text-[22px] font-bold text-[#2B1B12]">Tentang Kedai</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#5E4836]">{text}</p>
      </div>
    </section>
  );
};

export const LocationSection: React.FC<{ store: PublicStoreInfo }> = ({ store }) => {
  if (!store.address.trim()) return null;
  return (
    <section className="mt-6 px-4">
      <div className="rounded-[24px] bg-white p-6 shadow-[0_8px_24px_-18px_rgba(43,27,18,.55)]">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3E9DA] text-[#9A5A1E]">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 className="sf-display text-[20px] font-bold text-[#2B1B12]">Lokasi</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#5E4836]">{store.address}</p>
          </div>
        </div>
        <a
          href={mapsLink(store)}
          target="_blank"
          rel="noopener noreferrer"
          className="sf-press mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2B1B12] px-4 py-3 text-sm font-bold text-[#2B1B12] hover:bg-[#2B1B12] hover:text-white"
        >
          Buka Google Maps <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
};

export const StoreFooter: React.FC<{ store: PublicStoreInfo }> = ({ store }) => {
  const wa = normalizeWhatsapp(store.whatsappNumber || store.phone);
  const ig = instagramHandle(store.instagram);
  const hours = hoursLabel(store);
  return (
    <footer className="mt-8 px-4 pb-4">
      <div className="rounded-[24px] bg-[#2B1B12] p-6 text-white">
        <h2 className="sf-display text-[20px] font-bold">{store.storeName}</h2>
        {hours && (
          <p className="mt-2 flex items-center gap-2 text-sm text-white/75">
            <Clock className="h-4 w-4 text-[#F3C98B]" /> Jam operasional: {hours}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-press inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-semibold hover:bg-white/20"
            >
              <WhatsAppIcon className="h-4 w-4 text-[#7BE0A0]" /> WhatsApp
            </a>
          )}
          {ig && (
            <a
              href={`https://instagram.com/${ig}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-press inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-semibold hover:bg-white/20"
            >
              <InstagramIcon className="h-4 w-4 text-[#F3C98B]" /> @{ig}
            </a>
          )}
        </div>
        <p className="mt-5 text-[11px] text-white/45">
          © {new Date().getFullYear()} {store.storeName}
        </p>
      </div>
    </footer>
  );
};
