import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-5 gap-4">
      <div className="text-[64px]">🐾</div>
      <h1 className="text-[24px] font-black text-[#1A2332] font-display">Page Not Found</h1>
      <p className="text-[13px] text-[#6B7A8D] font-body text-center">This tag or page doesn&apos;t exist.</p>
      <Link href="/" className="px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta">
        Go Home
      </Link>
    </div>
  );
}
