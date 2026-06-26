import { cn } from "@/lib/utils";
export function Spinner({ className }: { className?: string }) {
  return <div className={cn("w-8 h-8 rounded-full border-[3px] border-[#4A8FE8] border-t-transparent animate-spin", className)} />;
}
