'use client'

import { Menu } from 'lucide-react'
import Logo from '@/components/Logo'
import Sidebar from '@/components/Sidebar'
import Button from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import { useDocumentsContext } from '@/hooks/DocumentsProvider'

interface AppShellProps {
  children: React.ReactNode
  sidebarOpen: boolean
  onOpenSidebar: () => void
  onCloseSidebar: () => void
}

export default function AppShell({
  children,
  sidebarOpen,
  onOpenSidebar,
  onCloseSidebar,
}: AppShellProps) {
  const { ownedLoading, ownedError } = useDocumentsContext()

  if (ownedLoading) {
    return <LoadingState layout="fullscreen" label="Loading workspace..." />
  }

  if (ownedError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f4f6fb] px-6 text-center">
        <p className="max-w-md text-sm text-red-700">{ownedError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6fb]">
      <Sidebar open={sidebarOpen} onClose={onCloseSidebar} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 shadow-sm lg:hidden">
          <Logo size="sm" href="/documents" />
          <Button
            variant="secondary"
            icon={Menu}
            className="!px-3 !py-2"
            aria-label="Open sidebar"
            onClick={onOpenSidebar}
          >
            Menu
          </Button>
        </header>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
