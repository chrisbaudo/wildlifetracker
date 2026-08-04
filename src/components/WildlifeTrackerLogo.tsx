import { useId } from 'react';

import { cn } from '@/lib/utils';

type WildlifeTrackerLogoProps = {
  className?: string;
  decorative?: boolean;
};

export function WildlifeTrackerLogo({
  className,
  decorative = false,
}: WildlifeTrackerLogoProps) {
  const titleId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : titleId}
    >
      {!decorative && <title id={titleId}>Wildlife Tracker</title>}
      <path
        d="M20.7 19.1C14.1 13.7 8 15.7 7 17.5c-1 1.9 1.7 7.5 8.7 9.2M43.3 19.1C49.9 13.7 56 15.7 57 17.5c1 1.9-1.7 7.5-8.7 9.2"
        fill="#D9E66A"
        stroke="#123D35"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 22.5c-4.4 3.7-6.2 9.4-4.1 14.6-3.1 4.8-.3 10.3 4.8 11.4 1.3 5.5 7.4 7.9 12 5.2 4.4 4.1 11.2 1.4 12.2-3.6 5.5-.8 8.6-6.6 5.8-11.4 2.7-5.3.4-11.8-4.7-14.4-2.7-5.7-9.8-7.7-14.8-3.9-4.1-3.5-10.5-3.4-14.5.4Z"
        fill="#F6F0D8"
        stroke="#123D35"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M20.4 28.3c2.2-2.6 5.7-3.4 8.8-2M43.6 28.3c-2.2-2.6-5.7-3.4-8.8-2"
        fill="none"
        stroke="#123D35"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <circle cx="25" cy="32" r="2.5" fill="#123D35" />
      <circle cx="39" cy="32" r="2.5" fill="#123D35" />
      <path
        d="M27 37.5c1.4-2.5 8.6-2.5 10 0 1.1 2-1.6 5.2-5 5.2s-6.1-3.2-5-5.2Z"
        fill="#F16F51"
        stroke="#123D35"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M32 42.7v3.1M24.5 46.4c4.7 3.3 10.3 3.3 15 0"
        fill="none"
        stroke="#123D35"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18.9 21.8c-2.4-4.5-.9-9.9 2.5-12.8M45.1 21.8c2.4-4.5.9-9.9-2.5-12.8"
        fill="none"
        stroke="#84BDA6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M47.5 7.4c3.7 1.6 6.6 4.6 8.1 8.3M49.8 2.9c5 2.1 9 6.2 11 11.3"
        fill="none"
        stroke="#F16F51"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}