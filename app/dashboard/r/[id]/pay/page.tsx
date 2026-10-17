import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Info, Receipt } from "lucide-react";
import { currentUserId } from "@/auth";
import { PayButton } from "@/components/dashboard/pay-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardBar } from "@/components/ui/card";
import { Divider, Section } from "@/components/ui/frame";
import { getOrCreatePendingPayment, getPaidPayment, paymentProvider } from "@/lib/payments";
import { getOwnedRestaurant } from "@/lib/queries";
import { LISTING_FEE } from "@/lib/constants";
import { formatMNT } from "@/lib/utils";

const STATUS_MESSAGES: Record<string, string> = {
  open: "Төлбөр хараахан төлөгдөөгүй байна.",
  pending: "Таны шилжүүлгийг платформын данс эзэмшигч шалгаж байна. Баталгаажмагц автоматаар идэвхжинэ.",
  expired: "Төлбөрийн хуудасны хугацаа дууссан. Дахин төлнө үү.",
  error: "Byl-ээс төлөв шалгаж чадсангүй. Түр хүлээгээд дахин шалгана уу.",
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> };

export default async function PayPage({ params, searchParams }: Props) {
  const statusMessage = STATUS_MESSAGES[(await searchParams).status ?? ""];
  const provider = paymentProvider();
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
        <p className="mt-2 text-muted-foreground">Төлбөр төлөгдмөгц таны газар хайлтад гарч эхэлнэ.</p>
      </Section>
      <Divider />
      <Section>
        <div className="mx-auto max-w-lg">
          <Card className="overflow-hidden">
            <CardBar icon={<Receipt />} title="Нэхэмжлэх" count={payment?.reference} />
            <dl className="divide-y text-sm">
              <Row label="Газар" value={restaurant.name} />
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
                    {statusMessage && (
                      <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" /> {statusMessage}
                      </p>
                    )}
                    {provider === "byl" ? (
                      <p className="text-sm text-muted-foreground">
                        Byl.mn-ийн аюулгүй хуудсанд QPay, банкны апп, SocialPay зэргээр төлнө. Төлсний дараа энд автоматаар
                        буцаж ирнэ.
                      </p>
                    ) : (
                      <p className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        Туршилтын горим (BYL_TOKEN тохируулаагүй): жинхэнэ мөнгө татагдахгүй. Товч дарахад төлбөр
                        төлөгдсөнд тооцогдоно.
                      </p>
                    )}
                    <PayButton provider={provider} paymentId={payment.id} restaurantId={restaurant.id} amount={payment.amount} />
                    {provider === "byl" && payment.byl_checkout_id != null && (
                      <Link href={`/api/byl/return?payment=${payment.id}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                        Төлсөн бол — төлбөр шалгах
                      </Link>
                    )}
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
