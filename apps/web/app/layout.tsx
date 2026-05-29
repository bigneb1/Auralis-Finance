import type { Metadata } from "next";
import { Geist_Mono, Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "../lib/providers";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = { title: "Auralis Finance", description: "AI risk and compliance for Mantle RWAs" };

const themeScript = `(function(){try{var t=localStorage.getItem('auralis-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVariables = `${newsreader.variable} ${inter.variable} ${geistMono.variable}`;
  return <html lang="en" className={fontVariables} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body className={`${fontVariables} font-sans`}><Providers>{children}</Providers></body></html>;
}
