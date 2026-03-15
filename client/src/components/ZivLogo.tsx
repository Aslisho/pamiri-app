export function ZivLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-label="Deve — Памирский язык"
      className="inline-block"
    >
      {/* Mountain silhouette */}
      <path
        d="M4 38L16 12L24 24L32 10L44 38"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Snow caps */}
      <path
        d="M14 16L16 12L18 16"
        stroke="hsl(24, 70%, 45%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        fill="none"
      />
      <path
        d="M30 14L32 10L34 14"
        stroke="hsl(24, 70%, 45%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        fill="none"
      />
      {/* Base line */}
      <line x1="2" y1="38" x2="46" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
