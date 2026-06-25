import type { Metadata } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";

import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "NetUP AI Presales Configurator",
  description: "Design your IPTV or OTT solution with a guided NetUP presales configurator.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} font-sans`}>{children}</body>
    </html>
  );
}
