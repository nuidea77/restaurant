import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Нүүр хуудас">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-[13px] font-black tracking-tight text-white">
        ШЖ
      </span>
      <span className="hidden whitespace-nowrap text-lg font-extrabold tracking-tight min-[360px]:inline">
        Хүлээн авалт<span className="text-brand">.</span>
      </span>
    </Link>
  );
}
