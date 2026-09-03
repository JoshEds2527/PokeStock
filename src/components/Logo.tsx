export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="pokestockLogoBg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#062a33" />
        </linearGradient>
        <linearGradient id="pokestockLogoCard" x1="12" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#04141a" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#pokestockLogoBg)" />
      <rect
        x="8"
        y="10"
        width="11"
        height="15"
        rx="2.2"
        fill="#071820"
        stroke="rgba(34,211,238,0.4)"
        strokeWidth="1"
        transform="rotate(-16 13.5 17.5)"
      />
      <rect
        x="12"
        y="8"
        width="12"
        height="16"
        rx="2.4"
        fill="url(#pokestockLogoCard)"
        stroke="#22d3ee"
        strokeWidth="1.7"
      />
      <rect
        x="14.2"
        y="10.3"
        width="2.6"
        height="2.6"
        rx="0.5"
        fill="rgba(103,232,249,0.6)"
        transform="rotate(45 15.5 11.6)"
      />
      <circle cx="21.3" cy="21.2" r="1.15" fill="#22d3ee" />
    </svg>
  );
}
