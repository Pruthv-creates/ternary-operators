import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASTRAEUS – Intelligence Command Centre",
  description: "Enterprise investigation intelligence platform for financial crime analysis and entity relationship mapping.",
  keywords: ["investigation", "intelligence", "financial crime", "entity analysis", "OSINT"],
};

import AuthGate from "@/components/AuthGate";

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
        <AuthGate>
          {children}
        </AuthGate>
      </body>
    </html>
  );
}
