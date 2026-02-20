/**
 * VLV Logo component — recreates the circular VLV branding mark.
 * Renders as an SVG so it stays crisp at any size.
 */

export default function Logo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer glow ring */}
      <circle cx="60" cy="60" r="56" stroke="#00E5CC" strokeWidth="2" opacity="0.3" />
      {/* Main circle border */}
      <circle cx="60" cy="60" r="52" stroke="#00E5CC" strokeWidth="2.5" />
      {/* Inner fill */}
      <circle cx="60" cy="60" r="48" fill="#0A0A0A" />
      {/* VLV text */}
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontFamily="'Playfair Display', serif"
        fontWeight="700"
        fontSize="32"
        fill="#FFFFFF"
        letterSpacing="3"
      >
        VLV
      </text>
    </svg>
  )
}
