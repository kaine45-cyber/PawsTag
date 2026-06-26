"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// Auth pages (login/register) redirect to dashboard if already logged in.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, isLoading, router]);

  // Show nothing while rehydrating to avoid layout flash
  if (isLoading) return null;

  return <>{children}</>;
}
