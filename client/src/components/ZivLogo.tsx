export function ZivLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-label="Deve — Памирский язык"
      className={`inline-block ${className}`}
    >
      {/* Mountain M — subtle fill for depth */}
      <path
        d="M5 39L18 10L24 25L30 10L43 39Z"
        fill="currentColor"
        opacity="0.10"
      />
      {/* Mountain M — bold outline */}
      <path
        d="M5 39L18 10L24 25L30 10L43 39"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Base line */}
      <line
        x1="3"
        y1="39"
        x2="45"
        y2="39"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
