'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import LoadingState from '@/components/ui/LoadingState'
import { DocumentsProvider } from '@/hooks/DocumentsProvider'
import { useAuth } from '@/hooks/useAuth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading) {
    return <LoadingState layout="fullscreen" />
  }

  if (!user) {
    return null
  }

  return (
    <DocumentsProvider>
      <AppShell
        sidebarOpen={sidebarOpen}
        onOpenSidebar={() => setSidebarOpen(true)}
        onCloseSidebar={() => setSidebarOpen(false)}
      >
        {children}
      </AppShell>
    </DocumentsProvider>
  )
}
