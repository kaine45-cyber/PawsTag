import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import "./globals.css";

// Load the Vietnamese subsets explicitly. Without them, accented Vietnamese
// glyphs can fall back to a different system font and make a single label look
// like it mixes font sizes and styles.
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PawsTag — Every Pet Deserves a Way Home",
  description: "Smart QR & NFC pet identification platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full">
      <body className={`${inter.variable} ${nunito.variable} h-full antialiased`}>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
