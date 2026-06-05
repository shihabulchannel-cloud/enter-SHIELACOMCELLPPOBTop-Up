import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { socialMediaStore } from '@/lib/store';
import { subscribeToStore } from '@/lib/events';

export default function WhatsAppFloat() {
  const [social, setSocial] = useState(socialMediaStore.get());

  useEffect(() => {
    return subscribeToStore('socialMedia', () => setSocial(socialMediaStore.get()));
  }, []);

  const waLink = `https://wa.me/${social.whatsapp}?text=Halo%20admin%2C%20saya%20ingin%20bertanya%20tentang%20layanan%20SHIELACOM%20CELL`;

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl bg-primary shadow-green text-white flex items-center justify-center animate-wa-pulse hover:scale-110 transition-transform btn-glow"
      title="Hubungi WhatsApp"
      aria-label="Hubungi kami via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
