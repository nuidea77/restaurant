import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageManager } from "@/components/dashboard/image-manager";
import { MenuUploader } from "@/components/dashboard/menu-uploader";
import { PackageReview } from "@/components/dashboard/package-review";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentUserId } from "@/auth";
import { getPackages, getRestaurantByOwner } from "@/lib/queries";

export default async function DashboardPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const restaurant = await getRestaurantByOwner(userId);
  const packages = restaurant ? await getPackages(restaurant.id, false) : [];

  const pendingCount = packages.filter((p) => !p.is_verified).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Рестораны удирдлага</h1>
        {restaurant && (
          <Link href={`/restaurants/${restaurant.id}`} className="text-sm underline">
            Нийтийн хуудсыг харах →
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профайл</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm restaurant={restaurant} />
        </CardContent>
      </Card>

      {restaurant && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Заал болон хоолны зураг</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageManager images={restaurant.images ?? []} userId={userId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Шинэ жилийн цэс</CardTitle>
              <p className="text-sm text-muted-foreground">
                Цэсээ байршуулахад AI багц бүрийн нэр, үнэ, хүний тоо, 1 хүний үнийг автоматаар гаргана. Та шалгаж
                &quot;Баталгаажуулах&quot; дарсны дараа л нийтэд харагдана.
              </p>
            </CardHeader>
            <CardContent>
              <MenuUploader userId={userId} />
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              Багцууд {pendingCount > 0 && <span className="text-base text-amber-700">({pendingCount} шалгах)</span>}
            </h2>
            {!packages.length && <p className="text-muted-foreground">Одоогоор багц алга. Дээрээс цэсээ байршуулна уу.</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {packages.map((p) => <PackageReview key={`${p.id}-${p.is_verified}-${p.total_price}`} pkg={p} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
