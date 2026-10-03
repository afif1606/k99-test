/**
 * Gaya khusus halaman /store (animasi + font). Diinjeksi lewat <style> sehingga
 * tidak menyentuh index.css milik dashboard POS. Semua kelas berawalan "sf-".
 */
export const STOREFRONT_CSS = `
.sf-root { font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-tap-highlight-color: transparent; }
.sf-display { font-family: 'Fraunces', Georgia, 'Times New Roman', serif; letter-spacing: -0.01em; }
@keyframes sf-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sf-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sf-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes sf-pop { 0% { transform: scale(1); } 40% { transform: scale(1.12); } 100% { transform: scale(1); } }
@keyframes sf-pulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.55); } 100% { box-shadow: 0 0 0 9px rgba(34,197,94,0); } }
@keyframes sf-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes sf-steam { 0% { opacity: 0; transform: translateY(8px) scaleX(1); } 40% { opacity: .7; } 100% { opacity: 0; transform: translateY(-22px) scaleX(1.3); } }
.sf-fade-up { animation: sf-fade-up .55s cubic-bezier(.2,.7,.2,1) both; }
.sf-fade-in { animation: sf-fade-in .25s ease-out both; }
.sf-sheet { animation: sf-sheet-up .32s cubic-bezier(.2,.8,.2,1) both; }
.sf-pop { animation: sf-pop .28s ease-out; }
.sf-live-dot { animation: sf-pulse 1.6s ease-out infinite; }
.sf-float { animation: sf-float 5s ease-in-out infinite; }
.sf-steam { animation: sf-steam 2.6s ease-in-out infinite; }
.sf-hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
.sf-hide-scroll::-webkit-scrollbar { display: none; }
.sf-press { transition: transform .12s ease, box-shadow .2s ease, background-color .2s ease; }
.sf-press:active { transform: scale(.96); }
@media (prefers-reduced-motion: reduce) {
  .sf-fade-up, .sf-fade-in, .sf-sheet, .sf-pop, .sf-live-dot, .sf-float, .sf-steam { animation: none !important; }
  .sf-press { transition: none; }
}
`;

export const STOREFRONT_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap';
