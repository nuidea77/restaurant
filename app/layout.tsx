import type { Metadata } from "next";
import "./globals.css";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { missingRequiredEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Шинэ жилийн хүлээн авалт — Ресторан хайх",
  description: "Улаанбаатарын ресторануудын Шинэ жилийн багцыг байршил, багтаамж, 1 хүний үнээр харьцуулж хайх.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const missing = missingRequiredEnv();
  if (missing.length) {
    return (
      <html lang="mn">
        <body className="min-h-screen antialiased">
          <SetupNotice missing={missing} />
        </body>
      </html>
    );
  }

  return (
    <html lang="mn">
      <body className="min-h-screen antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
