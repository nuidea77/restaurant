"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

// Нүүр хуудсан дээр байхад hash ижил байсан ч хэсэг рүү дахин гүйлгэнэ (шүүлтүүрийг хадгална).
export function SectionLink({ section, ...props }: { section: string } & Omit<ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      href={`/#${section}`}
      onClick={(e) => {
        props.onClick?.(e);
        const el = pathname === "/" ? document.getElementById(section) : null;
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(history.state, "", `${location.search || "/"}#${section}`);
      }}
    />
  );
}
