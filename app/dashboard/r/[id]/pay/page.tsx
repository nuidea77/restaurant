import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Info, Receipt } from "lucide-react";
import { currentUserId } from "@/auth";
import { PayButton } from "@/components/dashboard/pay-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardBar } from "@/components/ui/card";
import { Divider, Section } from "@/components/ui/frame";
import { getOrCreatePendingPayment, getPaidPayment, PAYMENT_PROVIDER } from "@/lib/payments";
import { getOwnedRestaurant } from "@/lib/queries";
import { LISTING_FEE } from "@/lib/constants";
import { formatMNT } from "@/lib/utils";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const restaurant = await getOwnedRestaurant((await params).id, userId);
  if (!restaurant) notFound();

  const payment = restaurant.is_paid
    ? await getPaidPayment(restaurant.id, userId)
    : await getOrCreatePendingPayment(restaurant.id, userId);

  return (
    <>
      <Section className="hero-glow pb-8">
        <Link
          href={`/dashboard/r/${restaurant.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {restaurant.name}
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Нийтлэлийн төлбөр</h1>
        <p className="mt-2 text-muted-foreground">Төлбөр төлөгдмөгц ресторан тань хайлтад гарч эхэлнэ.</p>
      </Section>
      <Divider />
      <Section>
        <div className="mx-auto max-w-lg">
          <Card className="overflow-hidden">
            <CardBar icon={<Receipt />} title="Нэхэмжлэх" count={payment?.reference} />
            <dl className="divide-y text-sm">
              <Row label="Ресторан" value={restaurant.name} />
              <Row label="Үйлчилгээ" value="Шинэ жилийн хүлээн авалтын платформд нийтлэх" />
              <Row label="Гүйлгээний утга" value={<code className="font-mono">{payment?.reference ?? "—"}</code>} />
              <div className="flex items-center justify-between px-5 py-4">
                <dt className="font-medium">Нийт төлөх</dt>
                <dd className="text-2xl font-extrabold tracking-tight text-primary">{formatMNT(payment?.amount ?? LISTING_FEE)}</dd>
              </div>
            </dl>
            <div className="border-t bg-accent p-5">
              {restaurant.is_paid ? (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 font-medium text-green-700">
                    <CheckCircle2 className="h-5 w-5" /> Төлбөр төлөгдсөн
                  </p>
                  <Link href={`/dashboard/r/${restaurant.id}`} className={buttonVariants({ className: "w-full" })}>
                    Цэс, зураг оруулах
                  </Link>
                </div>
              ) : (
                payment && (
                  <div className="space-y-3">
                    {PAYMENT_PROVIDER === "demo" && (
                      <p className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        Туршилтын горим: жинхэнэ мөнгө татагдахгүй. Товч дарахад төлбөр төлөгдсөнд тооцогдоно.
                      </p>
                    )}
                    <PayButton paymentId={payment.id} restaurantId={restaurant.id} amount={payment.amount} />
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
