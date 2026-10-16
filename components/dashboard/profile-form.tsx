"use client";

import { useActionState } from "react";
import { saveProfile } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { AMENITIES, DISTRICTS } from "@/lib/constants";
import type { Restaurant } from "@/lib/types";

export function ProfileForm({ restaurant }: { restaurant: Restaurant | null }) {
  const [state, action, pending] = useActionState(saveProfile, null);
  const r = restaurant;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name">Рестораны нэр</Label>
        <Input id="name" name="name" defaultValue={r?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="district">Дүүрэг</Label>
        <Select id="district" name="district" defaultValue={r?.district ?? ""} required>
          <option value="" disabled>
            Сонгох
          </option>
          {DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Утас</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={r?.phone} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Хаяг</Label>
        <Input id="address" name="address" defaultValue={r?.address} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Заалны багтаамж (хүн)</Label>
        <Input id="capacity" name="capacity" type="number" min={1} defaultValue={r?.capacity} required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="latitude">Өргөрөг</Label>
          <Input id="latitude" name="latitude" type="number" step="any" defaultValue={r?.latitude ?? ""} placeholder="47.918" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Уртраг</Label>
          <Input id="longitude" name="longitude" type="number" step="any" defaultValue={r?.longitude ?? ""} placeholder="106.917" />
        </div>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Тайлбар</Label>
        <Textarea id="description" name="description" defaultValue={r?.description ?? ""} />
      </div>
      <fieldset className="flex flex-wrap gap-4 sm:col-span-2">
        {AMENITIES.map((a) => (
          <label key={a.key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={a.key} defaultChecked={r?.[a.key] ?? false} /> {a.label}
          </label>
        ))}
      </fieldset>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Хадгалж байна..." : r ? "Хадгалах" : "Ресторан үүсгэх"}
        </Button>
        {state && <span className={state.ok ? "text-sm text-green-700" : "text-sm text-destructive"}>{state.ok ? "Хадгалагдлаа" : state.error}</span>}
      </div>
    </form>
  );
}
