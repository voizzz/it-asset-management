import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-sans',
});

import { getDb } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  let appName = "ITAM";
  try {
    const db = await getDb();
    const row = await db.get(`SELECT value FROM Settings WHERE key = 'logoName'`);
    if (row && row.value) appName = row.value;
  } catch (e) {
    console.error("Failed to load metadata logoName", e);
  }

  return {
    title: `${appName} - Modern Asset Management`,
    description: "Lightweight and powerful IT Asset Management system",
    themeColor: "#3b82f6",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
        <div className="app-container">
          {children}
        </div>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
