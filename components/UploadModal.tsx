'use client'

import { ChangeEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore'
import { Upload, X } from 'lucide-react'
import LoadingState from '@/components/ui/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase/client'
import { getDocumentContentRef } from '@/lib/documentContent'
import { parseMdToTiptap, parseTxtToTiptap } from '@/lib/utils'

interface UploadModalProps {
  open: boolean
  onClose: () => void
}

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isNavigating, startTransition] = useTransition()

  if (!open) return null

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension !== 'txt' && extension !== 'md') {
      setError('Supported formats: .txt and .md only.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const text = await file.text()
      const content =
        extension === 'md' ? parseMdToTiptap(text) : parseTxtToTiptap(text)
      const title = file.name.replace(/\.(txt|md)$/i, '') || 'Untitled Document'

      const newDocument = await addDoc(collection(db, 'documents'), {
        ownerId: user.uid,
        ownerEmail: user.email ?? '',
        title,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      await setDoc(getDocumentContentRef(newDocument.id), {
        body: content,
        updatedAt: serverTimestamp(),
      })

      onClose()
      startTransition(() => {
        router.push(`/documents/${newDocument.id}`)
      })
    } catch {
      setError('Upload failed. Please try again.')
      setLoading(false)
    } finally {
      event.target.value = ''
    }
  }

  const showTransitionOverlay = loading || isNavigating

  return (
    <>
      {showTransitionOverlay && (
        <LoadingState layout="overlay" label="Opening document..." />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 shadow-card-hover">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ajaia-navy-muted text-ajaia-navy">
              <Upload className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Upload file</h2>
              <p className="mt-1 text-sm text-slate-500">Supported formats: .txt and .md only</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="btn-ghost !px-2 !py-2">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center transition hover:border-ajaia-navy/30 hover:bg-ajaia-navy-muted/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ajaia-navy shadow-sm">
            <Upload className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <span className="mt-4 text-sm font-medium text-slate-700">
            {loading ? 'Uploading...' : 'Click to choose a file'}
          </span>
          <span className="mt-1 text-xs text-slate-400">or drag and drop</span>
          <input
            type="file"
            accept=".txt,.md"
            disabled={loading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {loading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <span className="spinner h-4 w-4" />
            Creating document from file...
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
        )}
      </div>
    </div>
    </>
  )
}
