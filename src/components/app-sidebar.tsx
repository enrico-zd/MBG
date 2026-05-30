"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { signOut } from "next-auth/react"
import { ChevronsUpDown, Coins, LayoutDashboard, LogOut, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"

type Item = { href: string; label: string; icon: ReactNode }

const items: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { href: "/projects", label: "Projects", icon: <Sparkles className="size-4" /> },
  { href: "/credits", label: "Credits", icon: <Coins className="size-4" /> },
  { href: "/generate", label: "Generate", icon: <Sparkles className="size-4" /> },
]

export function AppSidebar(props: { user: { name?: string | null; email?: string | null; image?: string | null } | null }) {
  const { collapsed } = useSidebar()
  const userName = props.user?.name ?? "shadcn"
  const userEmail = props.user?.email ?? "m@example.com"
  const userImage = props.user?.image ?? "/placeholder.svg"

  return (
    <aside
      className={cn(
        "group/sidebar flex h-svh shrink-0 flex-col border-r bg-card text-card-foreground transition-[width] duration-200 ease-linear",
        collapsed ? "w-14" : "w-64"
      )}
      data-collapsible={collapsed ? "icon" : "full"}
    >
      <div className="flex h-16 items-center gap-2 px-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div className={cn("flex flex-col leading-tight", collapsed && "hidden")}>
          <div className="text-sm font-semibold">AI Video Ads</div>
          <div className="text-xs text-muted-foreground">Studio</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 pb-4">
        {items.map((it) => (
          <Link
            key={`${it.href}-${it.label}`}
            href={it.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            {it.icon}
            <span className={cn("truncate", collapsed && "hidden")}>{it.label}</span>
          </Link>
        ))}
      </nav>

      <div data-slot="sidebar-footer" data-sidebar="footer" className="mt-auto flex flex-col gap-2 p-2">
        <ul data-slot="sidebar-menu" data-sidebar="menu" className="flex w-full min-w-0 flex-col gap-1">
          <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className="group/menu-item relative">
            <DropdownMenu>
              <DropdownMenuTrigger
                data-sidebar="menu-button"
                data-size="lg"
                data-active="false"
                className={cn(
                  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:p-0! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                  collapsed && "justify-center"
                )}
              >
                <span data-slot="avatar" data-size="default" className="group/avatar relative flex size-8 shrink-0 overflow-hidden select-none data-[size=lg]:size-10 data-[size=sm]:size-6 h-8 w-8 rounded-lg">
                  <img data-slot="avatar-image" className="aspect-square size-full" alt={userName} src={userImage} />
                </span>
                <div className={cn("grid flex-1 text-left text-sm leading-tight", collapsed && "hidden")}>
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs">{userEmail}</span>
                </div>
                <ChevronsUpDown className={cn("ml-auto size-4", collapsed && "hidden")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuItem
                  inset
                  onSelect={async () => {
                    await signOut({ callbackUrl: "/login" })
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem inset asChild>
                  <Link href="/dashboard">Account</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </div>
    </aside>
  )
}
