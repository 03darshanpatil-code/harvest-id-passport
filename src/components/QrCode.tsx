import QRCode from "react-qr-code";
import { buildPassportUrl } from "@/lib/crop-images";

/**
 * Renders a real, scannable QR code that encodes the public passport URL for a
 * crop (never a raw id, never a localhost address).
 */
export function QrCode({ value, size = 168 }: { value: string; size?: number }) {
  const content = buildPassportUrl(value);
  return (
    <div
      className="rounded-2xl bg-white p-2.5 shadow-soft"
      role="img"
      aria-label={`QR code for passport ${content}`}
    >
      <QRCode
        value={content}
        size={size}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    </div>
  );
}
