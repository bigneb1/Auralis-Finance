import type { Metadata } from "next";
import { Geist_Mono, Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "../lib/providers";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const description = "The AI risk and compliance layer for tokenized real-world assets on Mantle.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://auralisfinance.xyz"),
  title: { default: "Auralis Finance", template: "%s · Auralis Finance" },
  description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Auralis Finance",
    title: "Auralis Finance",
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Auralis Finance" }],
  },
  twitter: { card: "summary_large_image", title: "Auralis Finance", description, images: ["/og-image.png"] },
};

const themeScript = `(function(){try{var t=localStorage.getItem('auralis-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVariables = `${newsreader.variable} ${inter.variable} ${geistMono.variable}`;
  return <html lang="en" className={fontVariables} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body className={`${fontVariables} font-sans`}><Providers>{children}</Providers></body></html>;
}
