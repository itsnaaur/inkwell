'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText,
  FolderOpen,
  LayoutGrid,
  LogOut,
  MoreHorizontal,
  Trash2,
  Users,
} from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import Logo from '@/components/Logo'
import Button from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { useDocuments } from '@/hooks/useDocuments'
import type { DocumentItem } from '@/hooks/DocumentsProvider'
import { useTrash } from '@/hooks/useTrash'
import { moveDocumentToTrash } from '@/lib/trash'
import { formatTimestamp } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function UserAvatar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase()
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ajaia-navy text-sm font-semibold text-white">
      {initial}
    </div>
  )
}

function OwnedDocumentRow({
  document,
  isActive,
  menuOpen,
  onToggleMenu,
  onCloseSidebar,
}: {
  document: DocumentItem
  isActive: boolean
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseSidebar: () => void
}) {
  return (
    <div
      className={`group relative flex items-start rounded-xl transition ${
        isActive ? 'nav-item-active' : 'nav-item-inactive hover:bg-slate-100'
      }`}
    >
      <Link
        href={`/documents/${document.id}`}
        onClick={onCloseSidebar}
        className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-2.5"
      >
        <FileText className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="min-w-0 pr-1">
          <span className="block truncate font-medium">{document.title}</span>
          <span className="mt-0.5 block truncate text-xs text-slate-400">
            {formatTimestamp(document.updatedAt) || 'Recently updated'}
          </span>
        </span>
      </Link>

      <button
        type="button"
        aria-label={`Actions for ${document.title}`}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onToggleMenu()
        }}
        className={`mr-2 mt-2 shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-700 ${
          menuOpen ? 'bg-white text-slate-700 opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
        }`}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { owned, shared, sharedLoading, sharedError } = useDocuments()
  const { trashed } = useTrash()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [pendingTrash, setPendingTrash] = useState<DocumentItem | null>(null)
  const [trashing, setTrashing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-sidebar-doc-menu]')) return
      setOpenMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const isActive = (path: string) => pathname === path

  const handleMoveToTrash = async () => {
    if (!pendingTrash) return

    setTrashing(true)
    setError('')

    try {
      const documentId = pendingTrash.id
      await moveDocumentToTrash(documentId)
      setPendingTrash(null)
      setOpenMenuId(null)

      if (pathname === `/documents/${documentId}`) {
        router.push('/documents/trash')
      }
    } catch {
      setError('Could not move document to trash.')
    } finally {
      setTrashing(false)
    }
  }

  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-card transition-transform lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-3.5">
          <Logo size="md" href="/documents" />
          <p className="mt-1 text-xs font-medium text-slate-400">Document workspace</p>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            {user?.email && <UserAvatar email={user.email} />}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {user?.displayName || 'User'}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="sidebar-scroll min-h-0 flex-1 px-3 py-4">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          <Link
            href="/documents"
            onClick={onClose}
            className={`nav-item mb-2 ${
              pathname === '/documents' ? 'nav-item-active' : 'nav-item-inactive'
            }`}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span>All Documents</span>
          </Link>

          <Link
            href="/documents/trash"
            onClick={onClose}
            className={`nav-item mb-5 ${
              pathname === '/documents/trash' ? 'nav-item-active' : 'nav-item-inactive'
            }`}
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="flex-1">Trash</span>
            {trashed.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {trashed.length}
              </span>
            )}
          </Link>

          <p className="section-label flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={2} />
            My Documents
          </p>
          <div className="mt-2 space-y-0.5">
            {owned.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">No documents yet.</p>
            ) : (
              owned.map((document) => (
                <div key={document.id} className="relative" data-sidebar-doc-menu>
                  <OwnedDocumentRow
                    document={document}
                    isActive={isActive(`/documents/${document.id}`)}
                    menuOpen={openMenuId === document.id}
                    onCloseSidebar={onClose}
                    onToggleMenu={() =>
                      setOpenMenuId((current) =>
                        current === document.id ? null : document.id
                      )
                    }
                  />

                  {openMenuId === document.id && (
                    <div className="absolute right-2 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-card-hover">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setOpenMenuId(null)
                          setPendingTrash(document)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                        Move to trash
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <p className="section-label mt-6 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            Shared with Me
          </p>
          {sharedError ? (
            <p className="mt-2 px-3 py-2 text-xs text-red-700">{sharedError}</p>
          ) : sharedLoading ? (
            <LoadingState
              size="sm"
              label="Loading shared..."
              className="mt-2 px-3 py-2"
            />
          ) : (
            <div className="mt-2 space-y-0.5">
              {shared.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-400">Nothing shared yet.</p>
              ) : (
                shared.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    onClick={onClose}
                    className={`nav-item items-start ${
                      isActive(`/documents/${document.id}`)
                        ? 'nav-item-active'
                        : 'nav-item-inactive'
                    }`}
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{document.title}</span>
                      <span className="mt-1 inline-block rounded-full bg-ajaia-navy-muted px-2 py-0.5 text-[11px] font-medium text-ajaia-navy">
                        {document.ownerEmail}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white p-4">
          <Button variant="secondary" icon={LogOut} fullWidth onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </aside>

      <ConfirmDialog
        open={pendingTrash !== null}
        title="Move to trash?"
        description={
          pendingTrash
            ? `"${pendingTrash.title}" will be moved to trash and permanently deleted after 30 days.`
            : ''
        }
        confirmLabel="Move to trash"
        loading={trashing}
        destructive
        onConfirm={handleMoveToTrash}
        onClose={() => {
          if (!trashing) setPendingTrash(null)
        }}
      />
    </>
  )
}
