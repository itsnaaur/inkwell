import Link from 'next/link'

const sizes = {
  sm: { mark: 'h-6 w-6', text: 'text-lg' },
  md: { mark: 'h-8 w-8', text: 'text-xl' },
  lg: { mark: 'h-10 w-10', text: 'text-2xl' },
  xl: { mark: 'h-12 w-12', text: 'text-3xl' },
}

interface LogoProps {
  size?: keyof typeof sizes
  href?: string
  className?: string
}

export default function Logo({ size = 'md', href, className = '' }: LogoProps) {
  const { mark, text } = sizes[size]

  const logo = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className={`${mark} shrink-0`}>
        <rect width="32" height="32" rx="8" fill="#001a72" />
        <path
          d="M16 5c4.2 5.2 7.5 9.3 7.5 13.2a7.5 7.5 0 0 1-15 0C8.5 14.3 11.8 10.2 16 5Z"
          fill="#fff"
        />
        <path
          d="M12.2 18.4a3.900 3.900 0 0 0 3.800 3.600"
          fill="none"
          stroke="#001a72"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span className={`${text} font-semibold tracking-tight text-inkwell-navy`}>Inkwell</span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {logo}
      </Link>
    )
  }

  return logo
}
