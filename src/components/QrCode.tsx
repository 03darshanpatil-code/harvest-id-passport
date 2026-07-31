/**
 * Deterministic decorative QR-style code rendered from a crop id.
 * Used for the demo passport share flow.
 */
export function QrCode({ value, size = 168 }: { value: string; size?: number }) {
  const cells = 21;
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c > cells - 8) || (r > cells - 8 && c < 7);

  const modules: { r: number; c: number }[] = [];
  let state = hash || 1;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      state = (state * 1103515245 + 12345) >>> 0;
      if (isFinder(r, c)) continue;
      if ((state >>> 16) % 100 < 46) modules.push({ r, c });
    }
  }

  const finder = (r: number, c: number) => (
    <g key={`f${r}-${c}`}>
      <rect x={c} y={r} width={7} height={7} rx={1.6} fill="currentColor" />
      <rect
        x={c + 1}
        y={r + 1}
        width={5}
        height={5}
        rx={1.2}
        fill="var(--color-card)"
      />
      <rect x={c + 2} y={r + 2} width={3} height={3} rx={0.8} fill="currentColor" />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells} ${cells}`}
      role="img"
      aria-label={`QR code for passport ${value}`}
      className="text-primary animate-in fade-in zoom-in-95 duration-500"
    >
      <rect width={cells} height={cells} fill="var(--color-card)" />
      {modules.map((m) => (
        <rect
          key={`${m.r}-${m.c}`}
          x={m.c + 0.1}
          y={m.r + 0.1}
          width={0.8}
          height={0.8}
          rx={0.25}
          fill="currentColor"
        />
      ))}
      {finder(0, 0)}
      {finder(0, cells - 7)}
      {finder(cells - 7, 0)}
    </svg>
  );
}
