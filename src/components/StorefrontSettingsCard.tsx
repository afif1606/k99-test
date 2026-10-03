import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Smartphone, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { StorefrontSettings } from '../types';
import { formatIDR } from '../utils/formatters';
import { storefrontUrl } from '../utils/storefront';

/** Switch STATUS TOKO: perubahan langsung disimpan dan disinkronkan, halaman /store ikut berubah. */
export const StoreStatusSwitch: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { storeSettings, updateStorefront } = useApp();
  const isOpen = storeSettings.isOpen === true;
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border ${
        isOpen ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'
      } ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
    >
      <div>
        <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">Status Toko</span>
        <span className={`block font-bold ${isOpen ? 'text-emerald-300' : 'text-red-300'} ${compact ? 'text-xs' : 'text-sm'}`}>
          {isOpen ? '[ ON ] KEDAI BUKA' : '[ OFF ] KEDAI TUTUP'}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOpen}
        aria-label="Status toko online"
        onClick={() => updateStorefront({ isOpen: !isOpen })}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${isOpen ? 'bg-emerald-500' : 'bg-neutral-600'}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${isOpen ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
};

const inputCls =
  'w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500';

const pickDraft = (s: StorefrontSettings): Required<Omit<StorefrontSettings, 'isOpen'>> => ({
  openingTime: s.openingTime || '',
  closingTime: s.closingTime || '',
  whatsappNumber: s.whatsappNumber || '',
  storeDescription: s.storeDescription || '',
  instagram: s.instagram || '',
  mapsUrl: s.mapsUrl || '',
  heroImageUrl: s.heroImageUrl || '',
  logoUrl: s.logoUrl || '',
});

export const StorefrontSettingsCard: React.FC = () => {
  const { storeSettings, updateStorefront, menuItems, updateMenuItem } = useApp();
  const [draft, setDraft] = useState(() => pickDraft(storeSettings));
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = storefrontUrl();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStorefront({
      ...draft,
      whatsappNumber: draft.whatsappNumber.trim(),
      storeDescription: draft.storeDescription.trim(),
      instagram: draft.instagram.trim(),
      mapsUrl: draft.mapsUrl.trim(),
      heroImageUrl: draft.heroImageUrl.trim(),
      logoUrl: draft.logoUrl.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Salin link toko online:', url);
    }
  };

  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft({ ...draft, [k]: e.target.value });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Smartphone className="w-4 h-4 text-amber-500" />
          <span>Toko Online (Halaman Pesan /store)</span>
        </div>
        {saved && (
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Tersimpan</span>
          </div>
        )}
      </div>

      <StoreStatusSwitch />

      <div className="flex items-center gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
        <span className="flex-1 truncate font-mono text-neutral-300">{url}</span>
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-1 px-2.5 py-1.5 font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-md"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Disalin' : 'Salin'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-md"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Buka
        </a>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Jam Buka</label>
            <input type="time" value={draft.openingTime} onChange={set('openingTime')} className={inputCls} />
          </div>
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Jam Tutup</label>
            <input type="time" value={draft.closingTime} onChange={set('closingTime')} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-neutral-300 font-semibold mb-1">Nomor WhatsApp Pesanan</label>
          <input
            type="tel"
            value={draft.whatsappNumber}
            onChange={set('whatsappNumber')}
            placeholder="08xxxxxxxxxx (kosong = pakai No. Telepon profil)"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-neutral-300 font-semibold mb-1">Deskripsi Kedai</label>
          <textarea
            rows={3}
            maxLength={600}
            value={draft.storeDescription}
            onChange={set('storeDescription')}
            placeholder="Ceritakan singkat tentang kedai Anda"
            className={`${inputCls} resize-none`}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Instagram</label>
            <input value={draft.instagram} onChange={set('instagram')} placeholder="@namakedai" className={inputCls} />
          </div>
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Link Google Maps</label>
            <input value={draft.mapsUrl} onChange={set('mapsUrl')} placeholder="Kosong = dibuat dari alamat" className={inputCls} />
          </div>
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">URL Foto Banner</label>
            <input value={draft.heroImageUrl} onChange={set('heroImageUrl')} placeholder="https://..." className={inputCls} />
          </div>
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">URL Logo</label>
            <input value={draft.logoUrl} onChange={set('logoUrl')} placeholder="https://..." className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
          >
            Simpan Pengaturan Toko Online
          </button>
        </div>
      </form>

      {/* Menu yang tampil di toko online */}
      <div className="pt-3 border-t border-neutral-800 space-y-2">
        <span className="font-bold text-neutral-300 uppercase tracking-wider block">Menu di Toko Online</span>
        <p className="text-neutral-500 leading-relaxed">
          Hanya menu <b className="text-neutral-300">Tersedia</b> yang tampil di toko online (menu tidak tersedia juga
          disembunyikan dari Kasir). Tandai ★ untuk memasukkan ke Menu Favorit. Foto memakai link gambar (https://...).
        </p>
        {menuItems.length === 0 && <p className="text-neutral-500">Belum ada menu.</p>}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {menuItems.map((item) => (
            <div key={item.id} className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-white block truncate">{item.name}</span>
                  <span className="text-[11px] text-neutral-500">{formatIDR(item.price)}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateMenuItem({ ...item, isFeatured: !item.isFeatured })}
                    title="Tampilkan di Menu Favorit"
                    className={`p-1.5 rounded border ${
                      item.isFeatured
                        ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" fill={item.isFeatured ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMenuItem({ ...item, isAvailable: !item.isAvailable })}
                    className={`px-2 py-1 text-[10px] font-bold rounded border ${
                      item.isAvailable
                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-500'
                    }`}
                  >
                    {item.isAvailable ? 'Tersedia' : 'Habis'}
                  </button>
                </div>
              </div>
              <input
                key={`${item.id}:${item.image || ''}`}
                defaultValue={item.image || ''}
                placeholder="URL foto menu (https://...)"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (item.image || '')) updateMenuItem({ ...item, image: v || undefined });
                }}
                className={`${inputCls} text-[11px]`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
