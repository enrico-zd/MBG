import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" className={cn(className)} {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      className={cn("flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />
}

function BreadcrumbLink({
  className,
  href,
  ...props
}: React.ComponentProps<typeof Link>) {
  return <Link className={cn("transition-colors hover:text-foreground", className)} href={href} {...props} />
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span aria-current="page" className={cn("font-medium text-foreground", className)} {...props} />
}

function BreadcrumbSeparator({ className, children, ...props }: React.ComponentProps<"li">) {
  return (
    <li className={cn("inline-flex items-center text-muted-foreground", className)} aria-hidden="true" {...props}>
      {children ?? <ChevronRight className="size-3.5" />}
    </li>
  )
}

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
}

