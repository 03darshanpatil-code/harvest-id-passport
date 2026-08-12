import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  Home,
  LayoutGrid,
  Plus,
  ScrollText,
  Settings,
  Sprout,
  User,
  QrCode as QrIcon,
} from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QrScannerDialog } from "@/components/QrScannerDialog";
import { useHarvest } from "@/lib/harvest-store";
import { parseCropIdFromQr } from "@/lib/crop-images";
import { useI18n, type TranslationKey } from "@/i18n";

const nav = [
  { to: "/", labelKey: "nav.dashboard" as TranslationKey, icon: Home },
  { to: "/crops", labelKey: "nav.myCrops" as TranslationKey, icon: Sprout },
  { to: "/activities", labelKey: "nav.activities" as TranslationKey, icon: ScrollText },
  { to: "/passports", labelKey: "nav.passports" as TranslationKey, icon: FileText },
  { to: "/analytics", labelKey: "nav.analytics" as TranslationKey, icon: BarChart3 },
  { to: "/settings", labelKey: "nav.settings" as TranslationKey, icon: Settings },
] as const;

function Brand() {
  const { t } = useI18n();
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
          {t("brand.tagline")}
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
  const { profile } = useHarvest();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  const handleScanned = useCallback(
    (decodedText: string) => {
      const cropId = parseCropIdFromQr(decodedText);
      if (!cropId) {
        toast.error(t("qr.notRecognised"), {
          description: t("qr.notRecognisedDesc"),
        });
        return;
      }
      setScannerOpen(false);
      navigate({ to: "/passport/$cropId", params: { cropId } });
    },
    [navigate, t],
  );

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
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          ))}
        </nav>
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
                aria-label={t("nav.scanQr")}
                className="min-h-11 min-w-11 rounded-2xl"
                onClick={() => setScannerOpen(true)}
              >
                <QrIcon className="size-5" />
              </Button>
              <Link
                to="/settings"
                aria-label="Profile"
                className="grid size-10 place-items-center rounded-full bg-secondary font-display text-sm font-semibold text-secondary-foreground"
              >
                {profile.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("") || "RK"}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 py-2">
          <BottomLink to="/" label={t("nav.home")} icon={Home} active={isActive("/")} />
          <BottomLink to="/crops" label={t("nav.crops")} icon={Sprout} active={isActive("/crops")} />
          <Link
            to="/crops/new"
            aria-label={t("nav.registerCrop")}
            className="mx-auto grid size-14 -translate-y-3 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift"
          >
            <Plus className="size-6" />
          </Link>
          <BottomLink
            to="/passports"
            label={t("nav.passport")}
            icon={FileText}
            active={isActive("/passports")}
          />
          <BottomLink to="/settings" label={t("nav.profile")} icon={User} active={isActive("/settings")} />
        </div>
      </nav>

      <QrScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScanned={handleScanned} />
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
