type PageContainerVariant = 'default' | 'editor'

interface PageContainerProps {
  children: React.ReactNode
  variant?: PageContainerVariant
  className?: string
}

const variantClass: Record<PageContainerVariant, string> = {
  default: 'max-w-[1480px]',
  editor: 'max-w-none',
}

export default function PageContainer({
  children,
  variant = 'default',
  className = '',
}: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full ${variantClass[variant]} px-5 py-6 sm:px-8 lg:px-10 xl:px-12 sm:py-8 ${className}`}
    >
      {children}
    </div>
  )
}
