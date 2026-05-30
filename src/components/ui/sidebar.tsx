"use client"

import * as React from "react"
import { PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"

type SidebarContextValue = {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  toggle: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("Sidebar components must be used within SidebarProvider")
  return ctx
}

function SidebarProvider({
  defaultCollapsed = false,
  className,
  children,
}: {
  defaultCollapsed?: boolean
  className?: string
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const value = React.useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      setCollapsed,
      toggle: () => setCollapsed((v) => !v),
    }),
    [collapsed]
  )

  return (
    <SidebarContext.Provider value={value}>
      <div
        className={cn("group/sidebar-wrapper flex min-h-svh w-full bg-background text-foreground", className)}
        data-collapsible={collapsed ? "icon" : "full"}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-h-svh flex-1 flex-col", className)} {...props} />
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<"button">) {
  const { toggle } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Toggle sidebar</span>
    </button>
  )
}

export { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar }

