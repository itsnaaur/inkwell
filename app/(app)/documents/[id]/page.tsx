'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2, Pencil, Share2, Trash2 } from 'lucide-react'
import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import ConfirmDialog from '@/components/ConfirmDialog'
import { DocumentPageSkeleton } from '@/components/DocumentPageSkeleton'
import Editor from '@/components/Editor'
import PageContainer from '@/components/PageContainer'
import ShareModal from '@/components/ShareModal'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase/client'
import { getDocumentContentRef, loadDocumentContent } from '@/lib/documentContent'
import { syncShareMetadata } from '@/lib/shareMetadata'
import { isActiveDocument, moveDocumentToTrash } from '@/lib/trash'
import { formatTimestamp } from '@/lib/utils'

interface DocumentPageProps {
  params: { id: string }
}

interface DocumentData {
  ownerId: string
  ownerEmail: string
  title: string
  content: unknown
  updatedAt: unknown
  isDeleted?: boolean
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [editorContent, setEditorContent] = useState<unknown>(null)
  const [contentReady, setContentReady] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved')
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const accessCheckedRef = useRef(false)

  const checkAccess = useCallback(
    async (data: DocumentData) => {
      if (!user) return false
      if (data.ownerId === user.uid) return true

      const shareSnapshot = await getDoc(
        doc(db, 'documents', params.id, 'shares', user.uid)
      )
      return shareSnapshot.exists()
    },
    [params.id, user]
  )

  useEffect(() => {
    if (!user) return

    accessCheckedRef.current = false
    setContentReady(false)
    setEditorContent(null)
    setLoading(true)

    const unsubscribe = onSnapshot(doc(db, 'documents', params.id), async (snapshot) => {
      if (!snapshot.exists()) {
        router.push('/documents')
        return
      }

      const data = snapshot.data() as DocumentData

      if (!isActiveDocument(data)) {
        router.push(data.ownerId === user.uid ? '/documents/trash' : '/documents')
        return
      }

      if (!accessCheckedRef.current) {
        let allowed = data.ownerId === user.uid

        if (!allowed) {
          allowed = await checkAccess(data)
        }

        if (!allowed) {
          router.push('/documents')
          return
        }

        accessCheckedRef.current = true
        setHasAccess(true)

        const loadedContent = await loadDocumentContent(params.id, data.content)
        setEditorContent(loadedContent)
        setContentReady(true)
      }

      setDocumentData(data)
      setTitle(data.title)
      setLoading(false)
    })

    return unsubscribe
  }, [checkAccess, params.id, router, user])

  useEffect(() => {
    if (!hasAccess || !user) return

    const unsubscribe = onSnapshot(
      getDocumentContentRef(params.id),
      (snapshot) => {
        if (!snapshot.exists()) return
        setEditorContent(snapshot.data().body ?? null)
        setContentReady(true)
      },
      (error) => {
        console.error('Failed to load document content:', error)
        setError('Could not load document content.')
      }
    )

    return unsubscribe
  }, [hasAccess, params.id, user])

  const handleTitleSave = async () => {
    const trimmedTitle = title.trim() || 'Untitled Document'
    setTitle(trimmedTitle)
    setEditingTitle(false)

    try {
      const updatedAt = serverTimestamp()
      await updateDoc(doc(db, 'documents', params.id), {
        title: trimmedTitle,
        updatedAt,
      })

      if (user && documentData?.ownerId === user.uid) {
        syncShareMetadata(params.id, {
          title: trimmedTitle,
          ownerEmail: documentData.ownerEmail,
          ownerId: documentData.ownerId,
          updatedAt,
        }).catch(() => {
          // Share metadata sync is best-effort
        })
      }
    } catch {
      setError('Could not update title.')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')

    try {
      await moveDocumentToTrash(params.id)
      router.push('/documents/trash')
    } catch {
      setError('Could not move document to trash.')
      setDeleting(false)
    }
  }

  if (!user) {
    return null
  }

  if (loading || !documentData || !contentReady || !hasAccess) {
    return <DocumentPageSkeleton />
  }

  const isOwner = documentData.ownerId === user.uid

  return (
    <PageContainer variant="editor">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ajaia-navy hover:underline"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to documents
          </Link>

          <div className="group mt-4 flex items-center gap-2">
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-2xl font-semibold text-slate-900 shadow-sm outline-none focus:border-ajaia-navy focus:ring-2 focus:ring-ajaia-navy/10"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-2 text-left"
              >
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500 opacity-0 transition group-hover:opacity-100">
                  <Pencil className="h-3 w-3" strokeWidth={2} />
                  Rename
                </span>
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                saveStatus === 'saved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : saveStatus === 'saving'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-500'
                    : saveStatus === 'saving'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                }`}
              />
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                  Saving...
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                  All changes saved
                </>
              )}
              {saveStatus === 'idle' && `Updated ${formatTimestamp(documentData.updatedAt)}`}
            </span>
          </div>
        </div>

        {isOwner && (
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button variant="secondary" icon={Share2} onClick={() => setShareOpen(true)}>
              Share
            </Button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              Move to trash
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {hasAccess && contentReady && (
        <Editor
          docId={params.id}
          content={editorContent}
          onSaveStatusChange={setSaveStatus}
        />
      )}

      {isOwner && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          documentId={params.id}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Move to trash?"
        description={`"${title}" will be moved to trash and permanently deleted after 30 days.`}
        confirmLabel="Move to trash"
        loading={deleting}
        destructive
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) setDeleteOpen(false)
        }}
      />
    </PageContainer>
  )
}
