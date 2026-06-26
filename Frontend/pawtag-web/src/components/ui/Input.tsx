import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("w-full h-[50px] px-[18px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.15)] text-[14px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB]", className)} {...props} />
));
Input.displayName = "Input";
