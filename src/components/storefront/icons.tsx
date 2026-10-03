import React from 'react';

/** Ikon merek dibuat inline (lucide-react versi baru tidak lagi menyertakan ikon merek). */
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.04 2a9.93 9.93 0 0 0-8.5 15.08L2 22l5.06-1.5A9.94 9.94 0 1 0 12.04 2Zm0 18.1a8.17 8.17 0 0 1-4.16-1.14l-.3-.18-3 .89.9-2.93-.2-.31a8.15 8.15 0 1 1 6.76 3.67Zm4.47-6.1c-.25-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.77.96-.14.17-.28.19-.53.06-.25-.12-1.03-.38-1.96-1.2-.72-.65-1.2-1.44-1.35-1.69-.14-.24-.01-.38.11-.5.11-.11.25-.28.37-.42.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.47-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03 0 1.2.87 2.35 1 2.51.12.17 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28Z" />
  </svg>
);

export const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
);
