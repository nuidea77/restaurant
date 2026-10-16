import type { Metadata } from "next";
import "./globals.css";
import { SetupNotice } from "@/components/setup-notice";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Frame } from "@/components/ui/frame";
import { envDiagnostics, missingRequiredEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Шинэ жилийн хүлээн авалт — Ресторан хайх",
  description: "Улаанбаатарын ресторануудын Шинэ жилийн багцыг байршил, багтаамж, 1 хүний үнээр харьцуулж хайх.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const missing = missingRequiredEnv();
  if (missing.length) {
    return (
      <html lang="mn">
        <body className="min-h-screen font-sans antialiased">
          <SetupNotice missing={missing} diagnostics={envDiagnostics()} />
        </body>
      </html>
    );
  }

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
