"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-5 gap-4">
      <div className="text-[48px]">😿</div>
      <h2 className="text-[20px] font-black text-[#1A2332] font-display">Something went wrong</h2>
      <button onClick={reset} className="px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta">
        Try again
      </button>
    </div>
  );
}
