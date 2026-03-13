import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Epsilon3 – Intelligence Command Centre",
  description: "Enterprise investigation intelligence platform for financial crime analysis and entity relationship mapping.",
  keywords: ["investigation", "intelligence", "financial crime", "entity analysis", "OSINT"],
  icons: [
    {
      media: '(prefers-color-scheme: light)',
      url: '/favicon.png',
      href: '/favicon.png',
    },
    {
      media: '(prefers-color-scheme: dark)',
      url: '/favicon-inverted.png',
      href: '/favicon-inverted.png',
    }
  ],
};

import AuthGate from "@/components/auth/AuthGate";
import AppShell from "@/components/layout/AppShell";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0f172a] text-slate-100 overflow-hidden">
        <Toaster 
          position="bottom-right" 
          theme="dark" 
          richColors 
          toastOptions={{
            style: {
              background: '#0d1424',
              border: '1px solid #1e3a5f',
              color: '#cbd5e1',
            }
          }}
        />
        <AuthGate>
          <AppShell>
            {children}
          </AppShell>
        </AuthGate>
      </body>
    </html>
  );
}
