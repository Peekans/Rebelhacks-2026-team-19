export default function Banner({ width = '100%', className = '' }) {
  return (
    <img
      src="/banner.png"
      alt="Viva Las Ventures banner"
      width={width}
      className={className}
    />
  )
}