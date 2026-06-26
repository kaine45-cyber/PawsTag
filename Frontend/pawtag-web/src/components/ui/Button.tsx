import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: "primary" | "outline" | "ghost"; }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", ...props }, ref) => (
  <button ref={ref} className={cn("px-4 py-2 rounded-2xl font-bold font-display transition-all active:scale-95", variant === "primary" && "gradient-brand text-white shadow-cta", variant === "outline" && "border-2 border-[#4A8FE8] text-[#4A8FE8]", variant === "ghost" && "text-[#6B7A8D] hover:bg-[#F0F4FA]", className)} {...props} />
));
Button.displayName = "Button";
