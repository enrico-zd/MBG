"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function labelFor(seg: string) {
  if (seg === "dashboard") return "Dashboard"
  if (seg === "credits") return "Credits"
  if (seg === "projects") return "Projects"
  if (seg === "generate") return "Generate"
  return seg.length > 20 ? `${seg.slice(0, 8)}…${seg.slice(-6)}` : seg
}

export function AppBreadcrumb() {
  const pathname = usePathname() ?? "/"

  const { segments, hrefs } = useMemo(() => {
    const parts = pathname.split("?")[0].split("#")[0].split("/").filter(Boolean)
    const segs = parts.length ? parts : ["dashboard"]
    const h: string[] = []
    const acc: string[] = []
    for (const p of segs) {
      acc.push(p)
      h.push(`/${acc.join("/")}`)
    }
    return { segments: segs, hrefs: h }
  }, [pathname])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Build Your Application</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {segments.length > 1 ? (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={hrefs[0] ?? "/dashboard"}>{labelFor(segments[0] ?? "")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        ) : null}
        <BreadcrumbItem>
          <BreadcrumbPage>{labelFor(segments[segments.length - 1] ?? "")}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

