"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Clock, Music2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { deleteEvent, saveEvent } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDayMN, todayISO } from "@/lib/dates";
import type { EventItem } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

/** Эзэмшигч өөрийн газрын Шинэ жилийн эвентүүдийг нэмж, засна. */
export function EventManager({ restaurantId, events }: { restaurantId: string; events: EventItem[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const today = todayISO();

  return (
    <div className="space-y-4">
      {editing === "new" ? (
        <EventForm restaurantId={restaurantId} onDone={() => setEditing(null)} />
      ) : (
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Эвент нэмэх
        </Button>
      )}

      {events.length === 0 && editing !== "new" && (
        <p className="text-sm text-muted-foreground">
          Одоогоор эвент алга. Шинэ жилийн тоглолт, үдэшлэгээ нэмбэл &quot;Эвентүүд&quot; хуудсанд харагдана.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {events.map((e) =>
          editing === e.id ? (
            <div key={e.id} className="md:col-span-2">
              <EventForm restaurantId={restaurantId} event={e} onDone={() => setEditing(null)} />
            </div>
          ) : (
            <EventRow key={e.id} event={e} past={e.event_date < today} onEdit={() => setEditing(e.id)} />
          ),
        )}
      </div>
    </div>
  );
}

function EventRow({ event: e, past, onEdit }: { event: EventItem; past: boolean; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className={`rounded-xl border bg-card p-4 ${past ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{e.title}</p>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDayMN(e.event_date, true)}
            </span>
            {e.start_time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {e.start_time}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {e.capacity} хүн
            </span>
            {past && <span>· Өнгөрсөн</span>}
          </p>
        </div>
        <p className="shrink-0 text-right font-bold text-primary">{formatMNT(e.ticket_price)}</p>
      </div>
      {e.artists.length > 0 && (
        <p className="mt-2 flex items-start gap-1 text-sm">
          <Music2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {e.artists.join(", ")}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit} disabled={pending}>
          <Pencil className="h-3.5 w-3.5" /> Засах
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm("Энэ эвентийг устгах уу?")) return;
            startTransition(async () => {
              const res = await deleteEvent(e.id);
              if (!res.ok) alert(res.error);
            });
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Устгах
        </Button>
      </div>
    </div>
  );
}

function EventForm({ restaurantId, event, onDone }: { restaurantId: string; event?: EventItem; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(form: HTMLFormElement) {
    const fd = new FormData(form);
    const text = (k: string) => String(fd.get(k) ?? "");
    setError(null);
    startTransition(async () => {
      const res = await saveEvent(restaurantId, event?.id ?? null, {
        title: text("title"),
        event_date: text("event_date"),
        start_time: text("start_time"),
        capacity: text("capacity"),
        ticket_price: text("ticket_price"),
        artists: text("artists").split("\n"),
        items: text("items").split("\n"),
        description: text("description"),
      });
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        submit(ev.currentTarget);
      }}
      className="grid gap-4 rounded-xl border border-primary/40 bg-card p-5 ring-4 ring-primary/10 sm:grid-cols-2"
    >
      <p className="font-semibold sm:col-span-2">{event ? "Эвент засах" : "Шинэ эвент"}</p>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="ev-title">Эвентийн нэр</Label>
        <Input id="ev-title" name="title" defaultValue={event?.title} placeholder="ж: Шинэ жилийн гала үдэшлэг" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-date">Огноо</Label>
        <Input id="ev-date" name="event_date" type="date" min={event ? undefined : todayISO()} defaultValue={event?.event_date} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-time">Эхлэх цаг</Label>
        <Input id="ev-time" name="start_time" type="time" defaultValue={event?.start_time ?? "19:00"} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-cap">Хүний тоо (суудал)</Label>
        <Input id="ev-cap" name="capacity" type="number" min={1} defaultValue={event?.capacity} placeholder="200" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-price">1 хүний тасалбарын үнэ (₮)</Label>
        <Input id="ev-price" name="ticket_price" type="number" min={0} step={1000} defaultValue={event?.ticket_price} placeholder="150000" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-artists">Оролцох уран бүтээлчид (мөр бүрт нэг)</Label>
        <Textarea id="ev-artists" name="artists" rows={5} defaultValue={event?.artists.join("\n")} placeholder={"Хамтлаг ...\nДуучин ...\nDJ ..."} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-items">Хоол, ширээн дээрх зүйлс (мөр бүрт нэг)</Label>
        <Textarea id="ev-items" name="items" rows={5} defaultValue={event?.items.join("\n")} placeholder={"Хүйтэн зууш\nҮндсэн хоол\nШампан 1 хундага\nЖимс, амттан"} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="ev-desc">Нэмэлт мэдээлэл</Label>
        <Textarea id="ev-desc" name="description" rows={3} defaultValue={event?.description ?? ""} placeholder="Хувцаслалт, хөтөлбөр, тэмдэглэл..." />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {event ? "Хадгалах" : "Эвент нэмэх"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Болих
        </Button>
      </div>
    </form>
  );
}
