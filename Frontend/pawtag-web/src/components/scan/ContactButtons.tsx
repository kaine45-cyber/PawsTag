import { Phone, MessageCircle } from "lucide-react";
export function ContactButtons({ phone }: { phone: string }) {
  return (
    <div className="flex flex-col gap-3">
      <a href={`tel:${phone}`} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-call text-white font-bold font-display shadow-call active:scale-95 transition-all">
        <Phone size={18} /> Call Owner
      </a>
      <a href={`https://zalo.me/${phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-zalo text-white font-bold font-display shadow-zalo active:scale-95 transition-all">
        <MessageCircle size={18} /> Message via Zalo
      </a>
    </div>
  );
}
