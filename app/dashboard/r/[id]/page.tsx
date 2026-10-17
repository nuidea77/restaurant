import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DatesManager } from "@/components/dashboard/dates-manager";
import { EventManager } from "@/components/dashboard/event-manager";
import { ImageManager } from "@/components/dashboard/image-manager";
import { MenuUploader } from "@/components/dashboard/menu-uploader";
import { PackageList } from "@/components/dashboard/package-list";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ArrowLeft, ArrowUpRight, CalendarDays, CheckCircle2, CreditCard, Images, PartyPopper, Sparkles, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardBar } from "@/components/ui/card";
import { Divider, Section } from "@/components/ui/frame";
import { currentUserId } from "@/auth";
import { LISTING_FEE } from "@/lib/constants";
import { getOwnedRestaurant, getPackages, getVenueEvents } from "@/lib/queries";
import { formatMNT } from "@/lib/utils";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string }> };

export default async function ManageRestaurantPage({ params, searchParams }: Props) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const restaurant = await getOwnedRestaurant((await params).id, userId);
  if (!restaurant) notFound();
  const justPaid = (await searchParams).paid === "1";
  const [packages, events] = await Promise.all([getPackages(restaurant.id, false), getVenueEvents(restaurant.id)]);

  const pendingCount = packages.filter((p) => !p.is_verified).length;

  const verifiedCount = packages.length - pendingCount;

  return (
    <>
      <Section className="hero-glow pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Миний газрууд
            </Link>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              {restaurant ? restaurant.name : "Газрын удирдлага"}
            </h1>
          </div>
          {restaurant.is_paid ? (
            <Link href={`/restaurants/${restaurant.id}`} className={buttonVariants({ variant: "outline" })}>
              Нийтийн хуудас <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href={`/dashboard/r/${restaurant.id}/pay`} className={buttonVariants({})}>
              <CreditCard className="h-4 w-4" /> Төлбөр төлөх · {formatMNT(LISTING_FEE)}
            </Link>
          )}
        </div>
        {justPaid && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" /> Төлбөр амжилттай. Таны газар баталгаажсан багцтайгаар нийтэд харагдана.
          </div>
        )}
        {!restaurant.is_paid && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>
              Төлбөр төлөгдөөгүй тул газар тань нийтэд харагдахгүй байна. Та цэс, зураг, эвентээ одооноос бэлдэж болно.
            </span>
            <Link href={`/dashboard/r/${restaurant.id}/pay`} className="font-medium underline">
              Төлбөр төлөх
            </Link>
          </div>
        )}
        {restaurant && (
          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-xl">
            <Stat label="Нийтлэгдсэн" value={verifiedCount} />
            <Stat label="Шалгах" value={pendingCount} highlight={pendingCount > 0} />
            <Stat label="Зураг" value={restaurant.images?.length ?? 0} />
          </div>
        )}
      </Section>

      <Divider />

      <Section className="space-y-6">
        <Card className="overflow-hidden">
          <CardBar icon={<Store />} title="Профайл" />
          <div className="p-5">
            <ProfileForm restaurant={restaurant} userId={userId} />
          </div>
        </Card>

        {restaurant && (
          <Card className="overflow-hidden">
            <CardBar icon={<PartyPopper />} title="Шинэ жилийн эвентүүд" count={events.length} />
            <div className="p-5">
              <EventManager restaurantId={restaurant.id} events={events} />
            </div>
          </Card>
        )}

        {restaurant && (
          <Card className="overflow-hidden">
            <CardBar icon={<CalendarDays />} title="Захиалга авах өдрүүд" count={restaurant.dates.length} />
            <div className="grid gap-6 p-5 md:grid-cols-[1fr_minmax(0,22rem)]">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Хүлээн авалт хийх боломжтой (заал сул) өдрүүдээ хуанлиас дарж сонгоно уу. Сонгосон өдрүүд таны
                  газрын хуудсанд харагдах ба хэрэглэгчид өдрөөр шүүж хайна.
                </p>
                <p>Захиалга орж дүүрсэн өдрийг дахин дарж хасаад хадгална уу.</p>
              </div>
              <DatesManager restaurantId={restaurant.id} dates={restaurant.dates} />
            </div>
          </Card>
        )}

        {restaurant && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <CardBar icon={<Images />} title="Заал болон хоолны зураг" count={restaurant.images?.length ?? 0} />
              <div className="p-5">
                <ImageManager restaurantId={restaurant.id} userId={userId} images={restaurant.images ?? []} />
              </div>
            </Card>
            <Card className="overflow-hidden">
              <CardBar icon={<Sparkles />} title="Шинэ жилийн цэс (AI)" />
              <div className="space-y-4 p-5">
                <p className="text-sm text-muted-foreground">
                  Цэсээ байршуулахад AI багц бүрийн нэр, үнэ, хүний тоо, 1 хүний үнийг гаргана. Та шалгаж
                  &quot;Баталгаажуулах&quot; дарсны дараа л нийтэд харагдана.
                </p>
                <MenuUploader restaurantId={restaurant.id} userId={userId} />
              </div>
            </Card>
          </div>
        )}
      </Section>

      {restaurant && (
        <>
          <Divider />
          <Section>
            <PackageList restaurantId={restaurant.id} packages={packages} />
          </Section>
        </>
      )}
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${highlight ? "text-amber-600" : ""}`}>{value}</p>
    </div>
  );
}
