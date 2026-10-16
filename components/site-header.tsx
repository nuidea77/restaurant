import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          🎄 Шинэ жилийн хүлээн авалт
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Миний ресторан
              </Link>
              <form action={logout}>
                <button className={buttonVariants({ variant: "outline", size: "sm" })}>Гарах</button>
              </form>
            </>
          ) : (
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Ресторан эзэмшигч
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
