import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Frame } from "@/components/ui/frame";

export const metadata: Metadata = {
  title: "Шинэ жилийн хүлээн авалт — Ресторан хайх",
  description: "Улаанбаатарын ресторануудын Шинэ жилийн багцыг байршил, багтаамж, 1 хүний үнээр харьцуулж хайх.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        <Frame className="flex min-h-[calc(100vh-4rem)] flex-col">
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Frame>
      </body>
    </html>
  );
}
