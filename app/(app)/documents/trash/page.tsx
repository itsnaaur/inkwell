'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, RotateCcw, Trash2 } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import ConfirmDialog from '@/components/ConfirmDialog'
import Button from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import { useTrash } from '@/hooks/useTrash'
import {
  TRASH_RETENTION_DAYS,
  getDaysUntilPermanentDelete,
  permanentlyDeleteDocument,
  restoreDocument,
} from '@/lib/trash'
import { formatTimestamp } from '@/lib/utils'

export default function TrashPage() {
  const { trashed, loading } = useTrash()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedTitle, setSelectedTitle] = useState('')
  const [dialogType, setDialogType] = useState<'restore' | 'delete' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const openDialog = (type: 'restore' | 'delete', documentId: string, title: string) => {
    setSelectedId(documentId)
    setSelectedTitle(title)
    setDialogType(type)
    setError('')
  }

  const closeDialog = () => {
    if (actionLoading) return
    setDialogType(null)
    setSelectedId(null)
    setSelectedTitle('')
  }

  const handleConfirm = async () => {
    if (!selectedId || !dialogType) return

    setActionLoading(true)
    setError('')

    try {
      if (dialogType === 'restore') {
        await restoreDocument(selectedId)
      } else {
        await permanentlyDeleteDocument(selectedId)
      }
      closeDialog()
    } catch {
      setError('Could not complete that action. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <PageContainer>
      <div>
        <p className="text-sm font-medium text-ajaia-navy">Workspace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Trash</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Deleted documents stay here for {TRASH_RETENTION_DAYS} days before they are permanently
          removed.
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <LoadingState layout="section" label="Loading trash..." className="mt-8" />
      ) : trashed.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center px-6 py-14 text-center">
          <Trash2 className="h-10 w-10 text-slate-300" strokeWidth={1.75} />
          <p className="mt-4 font-medium text-slate-900">Trash is empty</p>
          <p className="mt-1 text-sm text-slate-500">
            Documents you delete will appear here and can be restored within{' '}
            {TRASH_RETENTION_DAYS} days.
          </p>
          <Link href="/documents" className="btn-secondary mt-6">
            Back to documents
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {trashed.map((document) => {
            const daysLeft = getDaysUntilPermanentDelete(document.deletedAt)

            return (
              <div key={document.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">{document.title}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                      Deleted {formatTimestamp(document.deletedAt) || 'recently'}
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      {daysLeft === 0
                        ? 'Permanently deleted soon'
                        : `Permanently deleted in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      icon={RotateCcw}
                      onClick={() => openDialog('restore', document.id, document.title)}
                    >
                      Restore
                    </Button>
                    <button
                      type="button"
                      onClick={() => openDialog('delete', document.id, document.title)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                      Delete forever
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={dialogType === 'restore'}
        title="Restore document?"
        description={`"${selectedTitle}" will be moved back to your documents.`}
        confirmLabel="Restore"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={dialogType === 'delete'}
        title="Delete forever?"
        description={`"${selectedTitle}" will be permanently deleted and cannot be recovered.`}
        confirmLabel="Delete forever"
        loading={actionLoading}
        destructive
        onConfirm={handleConfirm}
        onClose={closeDialog}
      />
    </PageContainer>
  )
}
