import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawsTag — Every Pet Deserves a Way Home",
  description: "Smart QR & NFC pet identification platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full">
      <body className="h-full antialiased">
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
