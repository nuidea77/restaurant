// UIAble компонент — https://uiable.com/r/card.json (shadcn registry)
import type React from "react"
import { ComponentProps } from "react"

// third-party
import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card relative rounded-lg border border-border bg-card",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "border-b border-border p-[25px] group-data-[size=sm]/card:p-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("h5 font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-[25px] group-data-[size=sm]/card:p-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "border-t border-border px-6.25 py-4 group-data-[size=sm]/card:px-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

/** Төслийн нэмэлт: картын дээд мөр — дүрс + гарчиг + баруун талд тоо. */
function CardBar({
  icon,
  title,
  count,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  count?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium", className)}>
      {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {count !== undefined && (
        <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  )
}

export { CardBar }
