import { MessageCircle } from 'lucide-react';

const WA_NUMBER = '6281234567890';

export default function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=Halo Admin SHIELACOM CELL, saya ingin bertanya tentang produk.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-green animate-wa-pulse cursor-pointer group transition-transform hover:scale-110"
      title="Chat WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
      <span className="absolute -top-10 right-0 bg-brand-dark text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        Hubungi Kami
      </span>
    </a>
  );
}
