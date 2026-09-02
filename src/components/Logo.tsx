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
      <rect width="32" height="32" rx="9" fill="#4f46e5" />
      <path
        d="M9 20.5V13a2 2 0 0 1 1-1.73l5-2.89a2 2 0 0 1 2 0l5 2.89a2 2 0 0 1 1 1.73v7.5a2 2 0 0 1-1 1.73l-5 2.89a2 2 0 0 1-2 0l-5-2.89a2 2 0 0 1-1-1.73Z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 12.5 16 16.3l6.7-3.8M16 16.3v7.4"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 10.2 12 14"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
