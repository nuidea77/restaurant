import type { Metadata } from "next";
import { PartyPopper, SearchX } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Section } from "@/components/ui/frame";
import { EVENT_PRICE_CAPS, VENUE_TYPE_KEYS } from "@/lib/constants";
import { isValidISODate, todayISO } from "@/lib/dates";
import { searchEvents } from "@/lib/queries";
import type { EventListRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Шинэ жилийн эвентүүд",
  description: "Шинэ жилийн тоглолт, үдэшлэгүүд — оролцох уран бүтээлчид, огноо, 1 хүний тасалбарын үнэ, хоол ундаа.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const today = todayISO();
  const date = isValidISODate(str("date")) && str("date") >= today ? str("date") : undefined;
  const type = (VENUE_TYPE_KEYS as readonly string[]).includes(str("type")) ? str("type") : undefined;
  const max = EVENT_PRICE_CAPS.includes(Number(str("max"))) ? Number(str("max")) : undefined;

  let events: EventListRow[] = [];
  let error = false;
  try {
    events = await searchEvents({ date, type, maxPrice: max, from: today });
  } catch (err) {
    console.error("events search failed", err);
    error = true;
  }

  return (
    <>
      <Section className="hero-glow pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary">
          <PartyPopper className="h-4 w-4" /> Шинэ жил
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">Эвентүүд</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
          Шинэ жилийн тоглолт, үдэшлэгүүд — оролцох уран бүтээлчид, огноо, суудлын тоо, 1 хүний тасалбарын үнэ, хоол ундааг нэг дор.
        </p>
      </Section>
      <Section className="space-y-6 pt-0">
        <EventFilters key={JSON.stringify({ date, type, max })} initial={{ date, type, max }} />
        <p className="text-sm text-muted-foreground">{error ? "Хайлт хийхэд алдаа гарлаа" : `${events.length} эвент олдлоо`}</p>
        {!error && events.length === 0 ? (
          <Empty className="rounded-xl border border-dashed bg-card py-14">
            <EmptyHeader className="mb-0">
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>Тохирох эвент олдсонгүй</EmptyTitle>
              <EmptyDescription>Өөр өдөр эсвэл үнийн хязгаар сонгож үзээрэй.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
