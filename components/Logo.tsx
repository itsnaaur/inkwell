import Image from 'next/image'
import Link from 'next/link'

const sizes = {
  sm: { height: 24, className: 'h-6' },
  md: { height: 32, className: 'h-8' },
  lg: { height: 40, className: 'h-10' },
  xl: { height: 48, className: 'h-12' },
}

interface LogoProps {
  size?: keyof typeof sizes
  href?: string
  className?: string
}

export default function Logo({ size = 'md', href, className = '' }: LogoProps) {
  const { height, className: sizeClass } = sizes[size]

  const image = (
    <Image
      src="/ajaia-logo.png"
      alt="Ajaia"
      width={Math.round(height * 3.5)}
      height={height}
      priority
      className={`object-contain ${sizeClass} w-auto ${className}`}
      style={{ width: 'auto', height: 'auto' }}
    />
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {image}
      </Link>
    )
  }

  return image
}
