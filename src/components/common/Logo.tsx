import React from 'react';

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  showText?: boolean;
}

/**
 * Save Our Spends (SoS) official logo:
 * A bundle of cash ascending to heaven, complete with angel wings,
 * a radiant golden halo, money strap, and celestial ascent rays.
 */
export function Logo({
  size = 40,
  className = '',
  ...props
}: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 select-none ${className}`}
      aria-label="Save Our Spends (SoS) Logo"
      role="img"
      {...props}
    >
      <defs>
        {/* Celestial background aura */}
        <radialGradient id="sos-divine-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#34d399" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#059669" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>

        {/* Ascension Ray gradient */}
        <linearGradient id="sos-ray-grad" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0" />
          <stop offset="60%" stopColor="#fef08a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fef9c3" stopOpacity="0.6" />
        </linearGradient>

        {/* Halo gold gradient */}
        <linearGradient id="sos-halo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="85%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Halo bloom glow */}
        <filter id="sos-halo-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Angel Wing gradients */}
        <linearGradient id="sos-wing-left" x1="90%" y1="80%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="30%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        <linearGradient id="sos-wing-right" x1="10%" y1="80%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="30%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        {/* Feather shading */}
        <linearGradient id="sos-wing-shadow-l" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="sos-wing-shadow-r" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Banknote gradients */}
        <linearGradient id="sos-cash-face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="40%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="sos-cash-edge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="50%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>

        <linearGradient id="sos-strap-face" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fef3c7" />
          <stop offset="65%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        {/* Cloud gradient */}
        <linearGradient id="sos-cloud-shading" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.15" />
        </linearGradient>

        {/* Cash bundle drop shadow */}
        <filter id="sos-bundle-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="4.5" floodColor="#022c22" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* 1. Divine Aura & Ascending Light Rays */}
      <circle cx="100" cy="100" r="85" fill="url(#sos-divine-aura)" />

      <g opacity="0.45">
        <polygon points="100,105 35,0 52,0" fill="url(#sos-ray-grad)" />
        <polygon points="100,105 72,0 88,0" fill="url(#sos-ray-grad)" />
        <polygon points="100,105 112,0 128,0" fill="url(#sos-ray-grad)" />
        <polygon points="100,105 148,0 165,0" fill="url(#sos-ray-grad)" />
        <polygon points="100,105 10,25 22,12" fill="url(#sos-ray-grad)" />
        <polygon points="100,105 178,12 190,25" fill="url(#sos-ray-grad)" />
      </g>

      {/* 2. Heavenly Clouds at Base */}
      <g fill="url(#sos-cloud-shading)">
        <path d="M 22 196 C 20 180 34 167 50 167 C 55 167 61 169 66 172 C 73 159 87 151 102 153 C 115 155 125 163 130 172 C 136 169 143 168 150 171 C 164 176 175 186 178 196 Z" />
      </g>

      {/* 3. Angel Wings */}
      {/* Left Wing */}
      <g>
        <path
          d="M 72 112 C 60 98 42 78 20 54 C 20 60 26 74 36 84 C 26 80 18 80 16 86 C 18 96 32 108 50 114 C 36 116 28 122 30 130 C 36 138 58 134 74 126 Z"
          fill="url(#sos-wing-shadow-l)"
        />
        <path
          d="M 70 106 C 62 88 46 64 22 42 C 20 46 25 60 36 70 C 24 66 16 63 14 68 C 16 77 27 89 44 95 C 29 93 21 95 20 102 C 23 111 38 120 56 122 C 38 123 30 128 32 135 C 39 142 62 138 74 124 Z"
          fill="url(#sos-wing-left)"
          stroke="#f1f5f9"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
        <path
          d="M 36 70 C 46 82 58 96 68 106 M 44 95 C 52 104 62 112 70 116 M 56 122 C 63 125 68 126 72 126"
          stroke="#cbd5e1"
          strokeWidth="0.75"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </g>

      {/* Right Wing */}
      <g>
        <path
          d="M 128 112 C 140 98 158 78 180 54 C 180 60 174 74 164 84 C 174 80 182 80 184 86 C 182 96 168 108 150 114 C 164 116 172 122 170 130 C 164 138 142 134 126 126 Z"
          fill="url(#sos-wing-shadow-r)"
        />
        <path
          d="M 130 106 C 138 88 154 64 178 42 C 180 46 175 60 164 70 C 176 66 184 63 186 68 C 184 77 173 89 156 95 C 171 93 179 95 180 102 C 177 111 162 120 144 122 C 162 123 170 128 168 135 C 161 142 138 138 126 124 Z"
          fill="url(#sos-wing-right)"
          stroke="#f1f5f9"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
        <path
          d="M 164 70 C 154 82 142 96 132 106 M 156 95 C 148 104 138 112 130 116 M 144 122 C 137 125 132 126 128 126"
          stroke="#cbd5e1"
          strokeWidth="0.75"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </g>

      {/* 4. Ascending Cash Bundle */}
      <g filter="url(#sos-bundle-shadow)">
        {/* Layered stack underneath showing thick cash wad */}
        <rect x="61" y="94" width="78" height="46" rx="6" fill="#064e3b" />
        <rect x="60" y="92" width="80" height="46" rx="6" fill="#047857" />
        <rect x="59" y="90" width="82" height="46" rx="6" fill="#059669" />

        {/* Paper bill edge striations */}
        <g stroke="url(#sos-cash-edge)" strokeWidth="0.8" opacity="0.85">
          <line x1="62" y1="135" x2="138" y2="135" />
          <line x1="61" y1="137" x2="139" y2="137" />
          <line x1="62" y1="139" x2="138" y2="139" />
        </g>

        {/* Front Top Banknote */}
        <rect
          x="58"
          y="86"
          width="84"
          height="48"
          rx="6"
          fill="url(#sos-cash-face)"
          stroke="#34d399"
          strokeWidth="1.2"
        />

        {/* Guilloche Security Border */}
        <rect
          x="62"
          y="90"
          width="76"
          height="40"
          rx="4"
          fill="none"
          stroke="#a7f3d0"
          strokeWidth="0.8"
          strokeDasharray="3 1.5"
          opacity="0.85"
        />

        {/* Corner Denomination Dots */}
        <g fill="#a7f3d0" opacity="0.9">
          <circle cx="67" cy="95" r="2.5" />
          <circle cx="133" cy="95" r="2.5" />
          <circle cx="67" cy="125" r="2.5" />
          <circle cx="133" cy="125" r="2.5" />
        </g>

        {/* Center Medallion */}
        <ellipse cx="100" cy="110" rx="16" ry="14" fill="#064e3b" stroke="#34d399" strokeWidth="1.2" />
        <ellipse
          cx="100"
          cy="110"
          rx="13"
          ry="11"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="0.6"
          strokeDasharray="2 1"
        />

        {/* Golden Currency Strap (Bank Band) wrapped around bundle */}
        <g>
          <rect
            x="91"
            y="85"
            width="18"
            height="52"
            rx="2"
            fill="url(#sos-strap-face)"
            stroke="#b45309"
            strokeWidth="0.8"
          />
          <line x1="93" y1="85" x2="93" y2="137" stroke="#b45309" strokeWidth="0.5" opacity="0.6" />
          <line x1="107" y1="85" x2="107" y2="137" stroke="#b45309" strokeWidth="0.5" opacity="0.6" />
          <circle cx="100" cy="110" r="6.5" fill="#fef08a" stroke="#b45309" strokeWidth="0.75" />
          <text
            x="100"
            y="112.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="5"
            fill="#78350f"
            textAnchor="middle"
            letterSpacing="0.2"
          >
            SoS
          </text>
        </g>
      </g>

      {/* 5. Floating Golden Halo */}
      <g filter="url(#sos-halo-glow)">
        <ellipse cx="100" cy="54" rx="28" ry="8" fill="none" stroke="url(#sos-halo-gold)" strokeWidth="4.5" />
        <ellipse cx="100" cy="53.5" rx="26" ry="7" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
        <path d="M 82 59 C 92 61 108 61 118 59" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      {/* 6. Celestial Sparkles & Stars */}
      <path d="M 100 24 Q 100 30 95 30 Q 100 30 100 36 Q 100 30 105 30 Q 100 30 100 24 Z" fill="#fef08a" />
      <path d="M 44 46 Q 44 50 40 50 Q 44 50 44 54 Q 44 50 48 50 Q 44 50 44 46 Z" fill="#fde047" />
      <path d="M 156 42 Q 156 46 152 46 Q 156 46 156 50 Q 156 46 160 46 Q 156 46 156 42 Z" fill="#fde047" />
      <path d="M 166 94 Q 166 97 163 97 Q 166 97 166 100 Q 166 97 169 97 Q 166 97 166 94 Z" fill="#ffffff" opacity="0.85" />
      <path d="M 34 100 Q 34 103 31 103 Q 34 103 34 106 Q 34 103 37 103 Q 34 103 34 100 Z" fill="#ffffff" opacity="0.85" />
      <circle cx="86" cy="40" r="1.2" fill="#ffffff" opacity="0.9" />
      <circle cx="118" cy="38" r="1.5" fill="#fef08a" opacity="0.9" />
      <circle cx="52" cy="74" r="1" fill="#ffffff" opacity="0.7" />
      <circle cx="148" cy="72" r="1" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}

export default Logo;
