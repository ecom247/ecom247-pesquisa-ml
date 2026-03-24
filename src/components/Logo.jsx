// ECOM247 Logo SVG Component
export default function Logo({ size = 'md', variant = 'full' }) {
  const sizes = {
    sm: { width: 120, height: 36 },
    md: { width: 160, height: 48 },
    lg: { width: 220, height: 66 },
    xl: { width: 300, height: 90 },
  }
  const { width, height } = sizes[size] || sizes.md

  if (variant === 'icon') {
    return (
      <svg width={height} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="42" stroke="#FFFFFF" strokeWidth="7" strokeDasharray="220 40" strokeLinecap="round"/>
        <polygon points="88,46 96,50 88,54" fill="#FF6803"/>
        <text x="50" y="64" fontFamily="Arial Black, sans-serif" fontSize="34" fontWeight="900" textAnchor="middle" fill="#FFFFFF">247</text>
      </svg>
    )
  }

  return (
    <svg width={width} height={height} viewBox="0 0 300 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ECOM text */}
      <text x="0" y="68" fontFamily="Arial Black, sans-serif" fontSize="62" fontWeight="900" fill="#000000">ECOM</text>
      {/* Circle ring */}
      <circle cx="228" cy="45" r="40" stroke="#FFFFFF" strokeWidth="6" strokeDasharray="200 50" strokeLinecap="round"/>
      {/* Arrow tip */}
      <polygon points="265,38 273,44 265,50" fill="#FF6803"/>
      {/* 247 text */}
      <text x="228" y="62" fontFamily="Arial Black, sans-serif" fontSize="38" fontWeight="900" textAnchor="middle" fill="#FFFFFF">247</text>
    </svg>
  )
}

// Version with orange background (for dark backgrounds where ECOM should be visible)
export function LogoOnDark({ size = 'md' }) {
  const sizes = {
    sm: { width: 120, height: 36 },
    md: { width: 160, height: 48 },
    lg: { width: 220, height: 66 },
    xl: { width: 300, height: 90 },
  }
  const { width, height } = sizes[size] || sizes.md

  return (
    <svg width={width} height={height} viewBox="0 0 300 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ECOM text - white on dark */}
      <text x="0" y="68" fontFamily="Arial Black, sans-serif" fontSize="62" fontWeight="900" fill="#FFFFFF">ECOM</text>
      {/* Circle ring - white */}
      <circle cx="228" cy="45" r="40" stroke="#FFFFFF" strokeWidth="6" strokeDasharray="200 50" strokeLinecap="round"/>
      {/* Arrow tip - orange */}
      <polygon points="265,38 273,44 265,50" fill="#FF6803"/>
      {/* 247 text - white */}
      <text x="228" y="62" fontFamily="Arial Black, sans-serif" fontSize="38" fontWeight="900" textAnchor="middle" fill="#FFFFFF">247</text>
    </svg>
  )
}
