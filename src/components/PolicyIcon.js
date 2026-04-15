export default function PolicyIcon({ name, className = 'h-6 w-6' }) {
  const shared = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    className,
  };

  switch (name) {
    case 'badge':
      return (
        <svg {...shared}>
          <path d="M12 3l2.3 2.1 3.1-.3.8 3 2.8 1.5-1.5 2.8.3 3-3 .8-2.1 2.3-2.7-1.2-2.7 1.2-2.1-2.3-3-.8.3-3L3 9.3l2.8-1.5.8-3 3.1.3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'store':
      return (
        <svg {...shared}>
          <path d="M4 9l1-4h14l1 4" />
          <path d="M5 9h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
          <path d="M9 13h6" />
        </svg>
      );
    case 'building':
      return (
        <svg {...shared}>
          <path d="M4 21h16" />
          <path d="M7 21V6l5-3 5 3v15" />
          <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...shared}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      );
    case 'hands':
      return (
        <svg {...shared}>
          <path d="M8 13l2.5-2.5a2 2 0 0 1 2.8 0l1.7 1.7a2 2 0 0 0 2.8 0L20 10" />
          <path d="M4 14l3-3 5 5-3 3a2 2 0 0 1-2.8 0L4 16.8A2 2 0 0 1 4 14z" />
          <path d="M20 14l-2-2-4 4 2 2a2 2 0 0 0 2.8 0l1.2-1.2A2 2 0 0 0 20 14z" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...shared}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M3 12h18" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...shared}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...shared}>
          <path d="M12 3v5" />
          <path d="M12 16v5" />
          <path d="M4 12h5" />
          <path d="M15 12h5" />
          <path d="M7 7l2 2" />
          <path d="M15 15l2 2" />
          <path d="M17 7l-2 2" />
          <path d="M9 15l-2 2" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...shared}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M4 8l8 6 8-6" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
