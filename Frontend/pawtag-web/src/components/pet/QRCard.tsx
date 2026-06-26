import { PawPrint } from "lucide-react";
// QR code display card — implementation coming soon
export function QRCard({ tagCode }: { tagCode: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 flex flex-col items-center gap-2">
      <div className="w-20 h-20 rounded-xl bg-[#F0F4FA] flex items-center justify-center">
        <PawPrint size={32} className="text-[#4A8FE8]" />
      </div>
      <p className="text-[11px] font-mono text-[#1A2332]">{tagCode}</p>
    </div>
  );
}
