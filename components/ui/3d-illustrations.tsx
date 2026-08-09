import React from 'react';

/**
 * 3D Leather Wallet Illustration (Sesuai mockup Net Worth card)
 */
export function LeatherWalletIllustration({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="walletBg" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#334155" />
          <stop offset="0.5" stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="walletStrap" x1="120" y1="80" x2="180" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#475569" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="moneyGreen" x1="40" y1="20" x2="160" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <filter id="shadow3d" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="4" dy="12" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      
      <g filter="url(#shadow3d)">
        {/* Money sticking out top */}
        <rect x="50" y="30" width="100" height="50" rx="6" transform="rotate(-6 100 55)" fill="url(#moneyGreen)" opacity="0.9" />
        <rect x="55" y="25" width="90" height="50" rx="6" transform="rotate(-2 100 50)" fill="#10b981" />
        <circle cx="100" cy="45" r="10" fill="#047857" opacity="0.4" />

        {/* Main Leather Body */}
        <rect x="25" y="55" width="150" height="110" rx="18" fill="url(#walletBg)" stroke="#475569" strokeWidth="2" />
        <path d="M 25 75 Q 100 90 175 75" stroke="#0f172a" strokeWidth="3" fill="none" opacity="0.6" />

        {/* Stitching lines */}
        <rect x="30" y="60" width="140" height="100" rx="14" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Closing Strap */}
        <path d="M 125 90 H 175 C 183 90 183 130 175 130 H 125 Z" fill="url(#walletStrap)" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="155" cy="110" r="7" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
        <circle cx="155" cy="110" r="3" fill="#334155" />
      </g>
    </svg>
  );
}

/**
 * 3D Bank Building Illustration (Sesuai mockup Rekening Bank / BNI / SeaBank card)
 */
export function BankBuildingIllustration({ className = "w-28 h-28" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bankRoof" x1="20" y1="40" x2="180" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#94a3b8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="bankPillar" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
          <stop stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <filter id="bankDropShadow" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="3" dy="10" stdDeviation="6" floodColor="#000" floodOpacity="0.6" />
        </filter>
      </defs>

      <g filter="url(#bankDropShadow)">
        {/* Base Steps */}
        <rect x="25" y="155" width="150" height="15" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
        <rect x="30" y="145" width="140" height="10" rx="2" fill="#475569" />

        {/* Pillars */}
        <rect x="42" y="85" width="16" height="60" rx="2" fill="url(#bankPillar)" stroke="#475569" strokeWidth="1" />
        <rect x="74" y="85" width="16" height="60" rx="2" fill="url(#bankPillar)" stroke="#475569" strokeWidth="1" />
        <rect x="110" y="85" width="16" height="60" rx="2" fill="url(#bankPillar)" stroke="#475569" strokeWidth="1" />
        <rect x="142" y="85" width="16" height="60" rx="2" fill="url(#bankPillar)" stroke="#475569" strokeWidth="1" />

        {/* Architrave Beam */}
        <rect x="32" y="73" width="136" height="12" rx="2" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

        {/* Triangular Pediment Roof */}
        <path d="M 25 73 L 100 35 L 175 73 Z" fill="url(#bankRoof)" stroke="#cbd5e1" strokeWidth="1.5" />
        
        {/* Emblem in roof */}
        <circle cx="100" cy="56" r="8" fill="#38bdf8" opacity="0.8" />
        <path d="M 100 51 L 103 57 L 97 57 Z" fill="#ffffff" />
      </g>
    </svg>
  );
}

/**
 * 3D Smartphone Illustration (Sesuai mockup E-Wallet / DANA card)
 */
export function SmartphoneIllustration({ className = "w-28 h-28" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="phoneBody" x1="40" y1="20" x2="160" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#475569" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="phoneScreen" x1="50" y1="35" x2="150" y2="165" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <filter id="phoneShadow" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="5" dy="12" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter="url(#phoneShadow)" transform="rotate(8 100 100)">
        {/* Phone Frame */}
        <rect x="50" y="20" width="100" height="160" rx="20" fill="url(#phoneBody)" stroke="#94a3b8" strokeWidth="2" />
        
        {/* Inner Screen */}
        <rect x="56" y="28" width="88" height="144" rx="14" fill="url(#phoneScreen)" />
        
        {/* Notch / Dynamic Island */}
        <rect x="85" y="34" width="30" height="6" rx="3" fill="#020617" />

        {/* Screen Content UI Simulation */}
        <circle cx="100" cy="80" r="18" fill="#38bdf8" opacity="0.3" />
        <path d="M 92 80 L 98 86 L 108 74" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        <rect x="70" y="110" width="60" height="8" rx="4" fill="#ffffff" opacity="0.7" />
        <rect x="78" y="124" width="44" height="6" rx="3" fill="#94a3b8" opacity="0.5" />
      </g>
    </svg>
  );
}

/**
 * 3D Cash Stack Illustration (Sesuai mockup Tunai / Cash card)
 */
export function CashStackIllustration({ className = "w-28 h-28" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="noteGradient" x1="0" y1="0" x2="140" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="noteRed" x1="0" y1="0" x2="140" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f43f5e" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
        <filter id="cashShadow" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.6" />
        </filter>
      </defs>

      <g filter="url(#cashShadow)">
        {/* Bottom Note */}
        <g transform="translate(30, 110) rotate(-8)">
          <rect x="0" y="0" width="130" height="60" rx="8" fill="url(#noteGradient)" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="65" cy="30" r="14" fill="#047857" opacity="0.5" />
        </g>

        {/* Middle Note */}
        <g transform="translate(35, 80) rotate(4)">
          <rect x="0" y="0" width="130" height="60" rx="8" fill="url(#noteRed)" stroke="#fb7185" strokeWidth="1.5" />
          <circle cx="65" cy="30" r="14" fill="#881337" opacity="0.5" />
          <text x="65" y="35" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" opacity="0.8">100k</text>
        </g>

        {/* Top Note Stack */}
        <g transform="translate(30, 50) rotate(-2)">
          <rect x="0" y="0" width="130" height="60" rx="8" fill="url(#noteGradient)" stroke="#6ee7b7" strokeWidth="2" />
          <rect x="8" y="8" width="114" height="44" rx="4" fill="none" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="65" cy="30" r="14" fill="#065f46" opacity="0.6" />
          <circle cx="65" cy="30" r="8" fill="#34d399" />
          {/* Paper Strap */}
          <rect x="55" y="0" width="20" height="60" fill="#fef08a" opacity="0.9" />
        </g>
      </g>
    </svg>
  );
}

/**
 * 3D Green Growth Chart Illustration (Sesuai mockup Total Pemasukan card)
 */
export function GreenChartIllustration({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <filter id="chartShadow" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter="url(#chartShadow)">
        {/* Bars */}
        <rect x="35" y="120" width="28" height="50" rx="6" fill="#334155" />
        <rect x="75" y="90" width="28" height="80" rx="6" fill="url(#barGrad)" opacity="0.7" />
        <rect x="115" y="50" width="28" height="120" rx="6" fill="url(#barGrad)" />

        {/* Upward Arrow */}
        <path d="M 30 110 L 75 75 L 120 40 L 160 25" stroke="#34d399" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 140 25 H 160 V 45" stroke="#34d399" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * 3D Red Loss Chart Illustration (Sesuai mockup Total Pengeluaran card)
 */
export function RedChartIllustration({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="redBarGrad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f43f5e" />
          <stop offset="1" stopColor="#9f1239" />
        </linearGradient>
        <filter id="redChartShadow" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter="url(#redChartShadow)">
        {/* Bars */}
        <rect x="35" y="50" width="28" height="120" rx="6" fill="url(#redBarGrad)" />
        <rect x="75" y="90" width="28" height="80" rx="6" fill="url(#redBarGrad)" opacity="0.7" />
        <rect x="115" y="130" width="28" height="40" rx="6" fill="#334155" />

        {/* Downward Trend Arrow */}
        <path d="M 30 40 L 75 80 L 120 120 L 160 155" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 140 155 H 160 V 135" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
