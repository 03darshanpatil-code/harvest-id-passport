import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  FileText,
  Home,
  LayoutGrid,
  LogOut,
  Plus,
  ScrollText,
  Settings,
  Sprout,
  User,
  Bell,
  QrCode as QrIcon,
} from "lucide-react";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/crops", label: "My Crops", icon: Sprout },
  { to: "/activities", label: "Activities", icon: ScrollText },
  { to: "/passports", label: "Passports", icon: FileText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
        <LayoutGrid className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-lg font-semibold leading-tight">
          HarvestID
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          Every harvest has an identity
        </span>
      </span>
    </Link>
  );
}

export function AppLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="size-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={() => toast("Signed out of the demo session")}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-[18px]" />
          Logout
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 sm:px-6">
            <div className="min-w-0">
              <div className="lg:hidden">
                <Brand />
              </div>
              {title ? (
                <div className="hidden lg:block">
                  <h1 className="truncate text-xl font-semibold">{title}</h1>
                  {subtitle ? (
                    <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Scan QR code"
                className="min-h-11 min-w-11 rounded-2xl"
                onClick={() => toast("Point your camera at a HarvestID passport QR")}
              >
                <QrIcon className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="relative min-h-11 min-w-11 rounded-2xl"
                onClick={() => toast("3 new updates from your fields")}
              >
                <Bell className="size-5" />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-gold" />
              </Button>
              <Link
                to="/settings"
                aria-label="Profile"
                className="grid size-10 place-items-center rounded-full bg-secondary font-display text-sm font-semibold text-secondary-foreground"
              >
                RK
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16">{children}</main>
      </div>

      {/* Floating AI assistant */}
      <Button
        onClick={() => toast.success("AI Assistant", { description: "How can I help with your fields today?" })}
        className="fixed bottom-24 right-4 z-30 h-14 gap-2 rounded-full px-5 shadow-lift lg:bottom-8 lg:right-8"
        aria-label="Open AI assistant"
      >
        <Bot className="size-5" />
        <span className="hidden sm:inline">AI Assistant</span>
      </Button>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 py-2">
          <BottomLink to="/" label="Home" icon={Home} active={isActive("/")} />
          <BottomLink to="/crops" label="Crops" icon={Sprout} active={isActive("/crops")} />
          <Link
            to="/crops/new"
            aria-label="Register crop"
            className="mx-auto grid size-14 -translate-y-3 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift"
          >
            <Plus className="size-6" />
          </Link>
          <BottomLink
            to="/passports"
            label="Passport"
            icon={FileText}
            active={isActive("/passports")}
          />
          <BottomLink to="/settings" label="Profile" icon={User} active={isActive("/settings")} />
        </div>
      </nav>
    </div>
  );
}

function BottomLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex min-h-11 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
