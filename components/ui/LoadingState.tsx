type LoadingSize = 'sm' | 'md' | 'lg'
type LoadingLayout = 'inline' | 'section' | 'page' | 'fullscreen' | 'overlay'

interface LoadingStateProps {
  label?: string
  size?: LoadingSize
  layout?: LoadingLayout
  className?: string
}

const spinnerSizeClass: Record<LoadingSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const layoutClass: Record<LoadingLayout, string> = {
  inline: 'flex items-center gap-2 text-slate-500',
  section: 'flex items-center gap-3 text-slate-500',
  page: 'flex min-h-[60vh] flex-1 items-center justify-center text-slate-600',
  fullscreen: 'flex h-screen items-center justify-center bg-[#f4f6fb] text-slate-600',
  overlay:
    'fixed inset-0 z-50 flex items-center justify-center bg-[#f4f6fb]/90 text-slate-600 backdrop-blur-[1px]',
}

export default function LoadingState({
  label = 'Loading...',
  size = 'md',
  layout = 'inline',
  className = '',
}: LoadingStateProps) {
  return (
    <div className={`${layoutClass[layout]} ${className}`} role="status" aria-live="polite">
      <span className={`spinner ${spinnerSizeClass[size]}`} />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  )
}
