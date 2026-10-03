import React from 'react';
import { Coffee, Minus, Plus } from 'lucide-react';
import type { PublicMenuItem } from '../../types';
import { formatRupiah } from '../../utils/storefront';

interface MenuCardProps {
  item: PublicMenuItem;
  qty: number;
  canOrder: boolean;
  onAdd: (id: string) => void;
  onDecrease: (id: string) => void;
  variant: 'featured' | 'row';
  delayMs?: number;
}

const Photo: React.FC<{ item: PublicMenuItem; className: string }> = ({ item, className }) => {
  const [failed, setFailed] = React.useState(false);
  if (item.image && !failed) {
    return (
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <div
      className={`${className} flex flex-col items-center justify-center text-[#5B3A22]`}
      style={{ backgroundImage: 'linear-gradient(145deg, #E9D8BF, #C9A57A)' }}
      role="img"
      aria-label={item.name}
    >
      <Coffee className="h-8 w-8 opacity-80" />
    </div>
  );
};

/** Tombol tambah / stepper jumlah. Dipakai di kedua varian kartu. */
const AddControl: React.FC<Pick<MenuCardProps, 'item' | 'qty' | 'canOrder' | 'onAdd' | 'onDecrease'>> = ({
  item,
  qty,
  canOrder,
  onAdd,
  onDecrease,
}) => {
  if (!canOrder) {
    return (
      <span className="rounded-full bg-[#EFE7DC] px-3 py-2 text-xs font-semibold text-[#8A7360]">Kedai tutup</span>
    );
  }
  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => onAdd(item.id)}
        className="sf-press inline-flex items-center gap-1.5 rounded-full bg-[#2B1B12] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#42291A]"
        aria-label={`Tambah ${item.name}`}
      >
        <Plus className="h-3.5 w-3.5" /> Tambah
      </button>
    );
  }
  return (
    <div className="sf-fade-in inline-flex items-center gap-1 rounded-full bg-[#2B1B12] p-1 text-white">
      <button
        type="button"
        onClick={() => onDecrease(item.id)}
        className="sf-press flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15"
        aria-label={`Kurangi ${item.name}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span key={qty} className="sf-pop min-w-[1.5rem] text-center text-sm font-bold tabular-nums">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onAdd(item.id)}
        className="sf-press flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15"
        aria-label={`Tambah ${item.name}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

export const MenuCard: React.FC<MenuCardProps> = (props) => {
  const { item, variant, delayMs = 0 } = props;

  if (variant === 'featured') {
    return (
      <article
        className="sf-fade-up w-[236px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_-16px_rgba(43,27,18,.5)]"
        style={{ animationDelay: `${delayMs}ms` }}
      >
        <Photo item={item} className="h-[200px] w-full" />
        <div className="space-y-1 p-4">
          <h3 className="sf-display line-clamp-1 text-[16px] font-bold text-[#2B1B12]">{item.name}</h3>
          <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-snug text-[#7A6551]">{item.description}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[15px] font-bold text-[#9A5A1E]">{formatRupiah(item.price)}</span>
            <AddControl {...props} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="sf-fade-up flex gap-3 rounded-[22px] bg-white p-3 shadow-[0_8px_24px_-18px_rgba(43,27,18,.55)]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <Photo item={item} className="h-[104px] w-[104px] shrink-0 rounded-2xl" />
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="sf-display line-clamp-1 text-[16px] font-bold text-[#2B1B12]">{item.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#7A6551]">{item.description}</p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold text-[#9A5A1E]">{formatRupiah(item.price)}</span>
          <AddControl {...props} />
        </div>
      </div>
    </article>
  );
};
