import type { Metadata } from "next";
import { Geist_Mono, Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "../lib/providers";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = { title: "Auralis Finance", description: "AI risk and compliance for Mantle RWAs" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${newsreader.variable} ${inter.variable} ${geistMono.variable} font-sans`}><Providers>{children}</Providers></body></html>;
}
