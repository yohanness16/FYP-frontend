"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  LogOutIcon,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { ADMIN_BRAND, ADMIN_NAV } from "@/lib/admin-nav";
import { ChatBot } from "@/components/chatbot/ChatBot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SIDEBAR_W = 260;
const SIDEBAR_COLLAPSED_W = 64;

export default function BusTrackShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-7 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }
  if (!user) return null;

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  return (
    <div className="flex min-h-screen bg-background">
      {/* ===== SIDEBAR ===== */}
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-sidebar text-sidebar-foreground border-r border-sidebar-border
          transition-[width] duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ width: sidebarWidth }}
      >
        {/* Brand */}
        <div className="flex h-14 items-center gap-3 px-4 shrink-0 border-b border-sidebar-border">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <ADMIN_BRAND.icon className="size-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{ADMIN_BRAND.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">Admin Console</p>
            </div>
          )}
          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex size-8 items-center justify-center rounded-lg hover:bg-sidebar-accent text-muted-foreground shrink-0"
          >
            <Menu size={16} />
          </button>
          {/* Close (mobile) */}
          <button onClick={() => setMobileOpen(false)} className="md:hidden flex size-8 items-center justify-center rounded-lg hover:bg-sidebar-accent text-muted-foreground shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {ADMIN_NAV.map((section) => (
            <div key={section.group}>
              {!collapsed && (
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {section.group}
                </div>
              )}
              {collapsed && <div className="h-2" />}
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        group relative flex items-center rounded-lg text-sm font-medium transition-colors
                        ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5 gap-3"}
                        ${active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        }
                      `}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />}
                      {/* Hover tooltip when collapsed */}
                      {collapsed && (
                        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[60] shadow-md border">
                          {label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          {!collapsed && <p className="px-1 pb-2 text-[10px] text-muted-foreground">{ADMIN_BRAND.tagline}</p>}
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">
              {user.username?.[0]?.toUpperCase() ?? "A"}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
                </div>
                <button onClick={logout} className="size-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0" title="Sign out">
                  <LogOutIcon size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div
        className="flex flex-1 flex-col min-h-screen md:ml-[var(--sidebar-width)]"
      >
        <style>{`
          :root { --sidebar-width: ${sidebarWidth}px; }
          @media (max-width: 767px) { :root { --sidebar-width: 0px; } }
        `}</style>
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-sm px-4 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
          >
            <Menu size={18} />
          </button>
          <div className="flex flex-1 items-center justify-between gap-3">
            <p className="hidden text-sm text-muted-foreground sm:block">
              Real-time fleet tracking &amp; density prediction
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="gap-2 pl-2 pr-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-primary/15 text-primary text-xs">
                          {user.username?.[0]?.toUpperCase() ?? "A"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[120px] truncate text-sm sm:inline">{user.username}</span>
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <span>{user.username}</span>
                      <span className="text-xs font-normal capitalize text-muted-foreground">{user.role}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOutIcon className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      <ChatBot />
    </div>
  );
}
