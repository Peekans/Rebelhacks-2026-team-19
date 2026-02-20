export default function Logo({ size = 48, className = '' }) {
  return (
    <img
      src="/iconlogo.png"
      alt="Viva Las Ventures logo"
      width={size}
      height={size}
      className={className}
    />
  )
}