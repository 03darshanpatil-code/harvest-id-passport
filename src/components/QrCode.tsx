import QRCode from "react-qr-code";
import { buildPassportUrl } from "@/lib/crop-images";
import { useI18n } from "@/i18n";

/**
 * Renders a real, scannable QR code that encodes the public passport URL for a
 * crop (never a raw id, never a localhost address).
 */
export function QrCode({ value, size = 168 }: { value: string; size?: number }) {
  const { t } = useI18n();
  const content = buildPassportUrl(value);
  return (
    <div
      className="rounded-2xl bg-white p-2.5 shadow-soft"
      role="img"
      aria-label={t("qr.codeAria", { url: content })}
    >
      <QRCode
        value={content}
        size={size}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    </div>
  );
}
