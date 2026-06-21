import Logo from '@/components/Logo'

interface AuthShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}

const features = [
  'Secure document storage',
  'Rich-text editing',
  'Team sharing by email',
]

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="relative hidden w-[44%] shrink-0 overflow-hidden bg-ajaia-navy lg:flex lg:flex-col">
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_40%)]" />
        <div className="absolute -right-16 top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -right-4 top-40 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute bottom-20 left-8 h-40 w-40 rounded-full border border-white/10" />
        <div className="absolute left-12 top-1/2 h-px w-32 bg-gradient-to-r from-white/40 to-transparent" />
        <div className="absolute right-16 top-1/3 h-24 w-px bg-gradient-to-b from-white/30 to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <div className="inline-flex rounded-xl border border-white/10 bg-white px-2.5 py-2 shadow-lg">
              <Logo size="lg" />
            </div>
          </div>

          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-white/70 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Enterprise document workspace
            </div>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
              Built for focused, professional work.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/70">
              Create, edit, upload, and share documents in a secure environment designed for
              clarity and collaboration.
            </p>

            <ul className="mt-8 space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-white/35">© Ajaia Docs · Secure by design</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f4f6fb] px-4 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-card">
              <Logo size="lg" />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            <div className="h-1 bg-gradient-to-r from-ajaia-navy via-ajaia-navy-light to-ajaia-navy" />
            <div className="p-8 sm:p-10">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-ajaia-navy">
                  Account access
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        </div>
      </div>
    </div>
  )
}
