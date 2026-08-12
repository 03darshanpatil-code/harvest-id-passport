import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

type ScannerStatus =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "ready" }
  | { kind: "error"; code: "permission" | "noCamera" | "unknown"; detail?: string };

/**
 * Camera-based QR scanner. Dynamically imports html5-qrcode so it never runs
 * during SSR, and reports camera permission/unavailability problems as
 * user-friendly, localized messages instead of crashing.
 */
export function QrScannerDialog({
  open,
  onOpenChange,
  onScanned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanned: (decodedText: string) => void;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const [status, setStatus] = useState<ScannerStatus>({ kind: "idle" });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus({ kind: "starting" });

    const start = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled || !containerRef.current) return;

        const scanner = new Html5Qrcode("harvestid-qr-scanner");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            // Stop scanning once a code is recognised so it doesn't re-fire.
            scanner.stop().catch(() => undefined);
            onScanned(decodedText);
          },
          () => undefined,
        );
        if (!cancelled) setStatus({ kind: "ready" });
      } catch (error) {
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError") {
          setStatus({ kind: "error", code: "permission" });
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setStatus({ kind: "error", code: "noCamera" });
        } else {
          setStatus({
            kind: "error",
            code: "unknown",
            detail: error instanceof Error ? error.message : "",
          });
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.stop().catch(() => undefined).finally(() => scanner.clear());
      }
    };
  }, [open, onScanned]);

  const statusMessage = (() => {
    switch (status.kind) {
      case "idle":
        return t("qr.cameraNotStarted");
      case "starting":
        return t("qr.starting");
      case "ready":
        return t("qr.ready");
      case "error":
        if (status.code === "permission") return t("qr.permissionDenied");
        if (status.code === "noCamera") return t("qr.noCamera");
        return t("qr.cameraError", { message: status.detail || t("common.error") });
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("qr.title")}</DialogTitle>
          <DialogDescription>{t("qr.desc")}</DialogDescription>
        </DialogHeader>

        {status.kind === "error" ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
            {statusMessage}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40">
            <div ref={containerRef} id="harvestid-qr-scanner" className="grid min-h-64 place-items-center" />
            <p className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
              {statusMessage}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => onOpenChange(false)}>
            {t("qr.close")}
          </Button>
          {status.kind === "error" ? (
            <Button
              className="flex-1 rounded-2xl"
              onClick={() => {
                setStatus({ kind: "starting" });
                scannerRef.current?.clear();
                // Re-run the effect by toggling open through the parent.
                onOpenChange(false);
                window.setTimeout(() => onOpenChange(true), 50);
              }}
            >
              {t("qr.tryAgain")}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
