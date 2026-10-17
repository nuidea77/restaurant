import Link from "next/link";
import { VenueIcon } from "@/components/venue-icon";
import { venueTypeLabel } from "@/lib/constants";
import { redirect } from "next/navigation";
import { ArrowUpRight, CreditCard, Plus, Store, Users } from "lucide-react";
import { currentUserId } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Divider, Section } from "@/components/ui/frame";
import { getOwnerRestaurants } from "@/lib/queries";

export default async function DashboardPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const restaurants = await getOwnerRestaurants(userId);
  const activeCount = restaurants.filter((r) => r.is_paid).length;

  return (
    <>
      <Section className="hero-glow pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Эзэмшигчийн самбар</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Миний газрууд</h1>
          </div>
          <Link href="/dashboard/new" className={buttonVariants({ size: "lg" })}>
            <Plus className="h-4 w-4" /> Газар нэмэх
          </Link>
        </div>
        {restaurants.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-xl">
            <Stat label="Нийт" value={restaurants.length} />
            <Stat label="Идэвхтэй" value={activeCount} />
            <Stat label="Төлбөр хүлээгдэж буй" value={restaurants.length - activeCount} />
          </div>
        )}
      </Section>

      <Divider />

      <Section>
        {restaurants.length === 0 ? (
          <Empty className="rounded-xl border border-dashed bg-card py-14">
            <EmptyHeader className="mb-4">
              <EmptyMedia variant="icon">
                <Store />
              </EmptyMedia>
              <EmptyTitle>Одоогоор газар алга</EmptyTitle>
              <EmptyDescription>Эхний газрынхаа (ресторан, лаунж, хаус, амралтын газар) мэдээллийг оруулна уу.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/dashboard/new" className={buttonVariants({})}>
                <Plus className="h-4 w-4" /> Газар нэмэх
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <div key={r.id} className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
                  <VenueIcon type={r.venue_type} className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {venueTypeLabel(r.venue_type)} · {r.district}
                  </span>
                  {r.is_paid ? (
                    <Badge className="border-green-200 bg-green-50 text-green-700">Идэвхтэй</Badge>
                  ) : (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-800">Төлбөр хүлээгдэж буй</Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      {r.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.images[0]} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold tracking-tight">{r.name}</h3>
                      <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" /> {r.capacity} · {r.package_count} багц
                        {r.pending_count > 0 && <span className="text-amber-700"> · {r.pending_count} шалгах</span>}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Link href={`/dashboard/r/${r.id}`} className={buttonVariants({ variant: "outline", className: "flex-1" })}>
                      Удирдах
                    </Link>
                    {r.is_paid ? (
                      <Link href={`/restaurants/${r.id}`} className={buttonVariants({ variant: "ghost" })} aria-label="Нийтийн хуудас">
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link href={`/dashboard/r/${r.id}/pay`} className={buttonVariants({ className: "flex-1" })}>
                        <CreditCard className="h-4 w-4" /> Төлөх
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
