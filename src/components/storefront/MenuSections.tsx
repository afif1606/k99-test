import React, { useMemo, useState } from 'react';
import type { PublicMenuItem } from '../../types';
import { MenuCard } from './MenuCard';
import type { StoreCart } from './useStoreCart';

interface MenuSectionsProps {
  menu: PublicMenuItem[];
  cart: StoreCart;
  canOrder: boolean;
}

const SectionTitle: React.FC<{ eyebrow: string; title: string }> = ({ eyebrow, title }) => (
  <div className="px-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B0763A]">{eyebrow}</p>
    <h2 className="sf-display text-[24px] font-bold text-[#2B1B12]">{title}</h2>
  </div>
);

/** MENU FAVORIT: item bertanda favorit di dashboard; bila belum ada, 4 menu pertama. */
export const FeaturedMenu: React.FC<MenuSectionsProps> = ({ menu, cart, canOrder }) => {
  const featured = useMemo(() => {
    const flagged = menu.filter((m) => m.isFeatured);
    return (flagged.length > 0 ? flagged : menu).slice(0, 6);
  }, [menu]);
  if (featured.length === 0) return null;
  return (
    <section className="mt-9 space-y-4">
      <SectionTitle eyebrow="Pilihan kami" title="Menu Favorit" />
      <div className="sf-hide-scroll -mb-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4">
        {featured.map((item, i) => (
          <MenuCard
            key={item.id}
            item={item}
            variant="featured"
            qty={cart.qtyOf(item.id)}
            canOrder={canOrder}
            onAdd={cart.add}
            onDecrease={cart.decrease}
            delayMs={i * 70}
          />
        ))}
      </div>
    </section>
  );
};

const ALL = 'Semua';

export const FullMenu: React.FC<MenuSectionsProps> = ({ menu, cart, canOrder }) => {
  const [category, setCategory] = useState<string>(ALL);
  const categories = useMemo(() => [ALL, ...Array.from(new Set(menu.map((m) => m.category).filter(Boolean)))], [menu]);
  const active = categories.includes(category) ? category : ALL;
  const shown = active === ALL ? menu : menu.filter((m) => m.category === active);

  return (
    <section id="sf-menu" className="mt-9 scroll-mt-20 space-y-4">
      <SectionTitle eyebrow="Semua sajian" title="Menu" />
      {categories.length > 2 && (
        <div className="sf-hide-scroll flex gap-2 overflow-x-auto px-4">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`sf-press shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                c === active ? 'bg-[#2B1B12] text-white' : 'bg-white text-[#6B5441] hover:bg-[#F1E7D8]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-[#8A7360]">Belum ada menu yang tersedia saat ini.</p>
      ) : (
        <div className="space-y-3 px-4">
          {shown.map((item, i) => (
            <MenuCard
              key={item.id}
              item={item}
              variant="row"
              qty={cart.qtyOf(item.id)}
              canOrder={canOrder}
              onAdd={cart.add}
              onDecrease={cart.decrease}
              delayMs={Math.min(i, 8) * 45}
            />
          ))}
        </div>
      )}
    </section>
  );
};
