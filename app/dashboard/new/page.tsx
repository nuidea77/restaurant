import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
import { currentUserId } from "@/auth";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card, CardBar } from "@/components/ui/card";
import { Divider, Section } from "@/components/ui/frame";
import { LISTING_FEE } from "@/lib/constants";
import { formatMNT } from "@/lib/utils";

export default async function NewRestaurantPage() {
  if (!(await currentUserId())) redirect("/login");

  return (
    <>
      <Section className="hero-glow pb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Миний ресторанууд
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Ресторан нэмэх</h1>
        <ol className="mt-4 flex flex-wrap gap-2 text-sm">
          <Step n={1} active>
            Мэдээлэл
          </Step>
          <Step n={2}>Төлбөр · {formatMNT(LISTING_FEE)}</Step>
          <Step n={3}>Цэс, зураг</Step>
        </ol>
      </Section>
      <Divider />
      <Section>
        <Card className="overflow-hidden">
          <CardBar icon={<Store />} title="Рестораны мэдээлэл" />
          <div className="p-5">
            <ProfileForm restaurant={null} />
          </div>
        </Card>
      </Section>
    </>
  );
}

function Step({ n, active, children }: { n: number; active?: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${active ? "border-primary bg-brand-soft text-primary" : "bg-card text-muted-foreground"}`}
    >
      <span className="tabular-nums font-semibold">{n}</span> {children}
    </li>
  );
}
