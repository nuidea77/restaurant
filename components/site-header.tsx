import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { SectionLink } from "@/components/section-link";
import { buttonVariants } from "@/components/ui/button-variants";

export async function SiteHeader() {
  // Auth тохиргоо дутуу үед ч толгой хэсэг бүх хуудсыг унагахгүй.
  const session = await auth().catch(() => null);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Logo />
          <nav className="flex items-center gap-6 text-sm font-medium text-foreground/80">
            <SectionLink section="results" className="hover:text-foreground">
              Ресторанууд
            </SectionLink>
            <SectionLink section="how" className="hidden hover:text-foreground md:inline">
              Хэрхэн ажилладаг
            </SectionLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className={buttonVariants({ variant: "dark", size: "sm" })}>
                Миний ресторанууд
              </Link>
              <form action={logout}>
                <button className={buttonVariants({ variant: "outline", size: "sm" })}>Гарах</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Нэвтрэх
              </Link>
              <Link href="/dashboard/new" className={buttonVariants({ variant: "dark", size: "sm", className: "hidden sm:inline-flex" })}>
                Ресторан нэмэх
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
