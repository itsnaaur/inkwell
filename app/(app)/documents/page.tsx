'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import {
  Clock,
  FilePlus,
  FileText,
  FolderOpen,
  Upload,
  Users,
} from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import UploadModal from '@/components/UploadModal'
import Button from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { useDocuments } from '@/hooks/useDocuments'
import { db } from '@/lib/firebase/client'
import { formatTimestamp } from '@/lib/utils'

export default function DocumentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { owned, shared, sharedLoading, sharedError } = useDocuments()
  const [creating, setCreating] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [error, setError] = useState('')
  const [isNavigating, startTransition] = useTransition()

  const handleCreateDocument = async () => {
    if (!user || creating || isNavigating) return

    setCreating(true)
    setError('')

    try {
      const newDocument = await addDoc(collection(db, 'documents'), {
        ownerId: user.uid,
        ownerEmail: user.email ?? '',
        title: 'Untitled Document',
        content: null,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      startTransition(() => {
        router.push(`/documents/${newDocument.id}`)
      })
    } catch {
      setError('Could not create document. Please try again.')
      setCreating(false)
    }
  }

  const showTransitionOverlay = creating || isNavigating

  return (
    <>
      {showTransitionOverlay && (
        <LoadingState layout="overlay" label="Opening document..." />
      )}

      <PageContainer>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ajaia-navy">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Documents</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
            Create, edit, upload, and share your documents from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" icon={Upload} onClick={() => setUploadOpen(true)}>
            Upload file
          </Button>
          <Button
            variant="primary"
            icon={FilePlus}
            onClick={handleCreateDocument}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'New document'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <FolderOpen className="h-5 w-5 text-ajaia-navy" strokeWidth={2} />
            My Documents
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {owned.length}
          </span>
        </div>
        {owned.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ajaia-navy-muted text-ajaia-navy">
              <FileText className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="mt-4 font-medium text-slate-900">No documents yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first document to get started.</p>
            <Button
              variant="primary"
              icon={FilePlus}
              className="mt-6"
              onClick={handleCreateDocument}
              disabled={creating}
            >
              New document
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {owned.map((document) => (
              <Link
                key={document.id}
                href={`/documents/${document.id}`}
                className="card group p-5 transition hover:-translate-y-0.5 hover:border-ajaia-navy/20 hover:shadow-card-hover"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ajaia-navy-muted text-ajaia-navy transition group-hover:bg-ajaia-navy group-hover:text-white">
                  <FileText className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{document.title}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                  Updated {formatTimestamp(document.updatedAt) || 'recently'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Users className="h-5 w-5 text-ajaia-navy" strokeWidth={2} />
            Shared with Me
          </h2>
          {!sharedLoading && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {shared.length}
            </span>
          )}
        </div>
        {sharedError ? (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{sharedError}</p>
        ) : sharedLoading ? (
          <LoadingState layout="section" label="Loading shared documents..." className="mt-2" />
        ) : shared.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-10 text-center">
            <Users className="h-8 w-8 text-slate-300" strokeWidth={1.75} />
            <p className="mt-3 text-sm text-slate-500">
              Documents shared with you will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shared.map((document) => (
              <Link
                key={document.id}
                href={`/documents/${document.id}`}
                className="card group p-5 transition hover:-translate-y-0.5 hover:border-ajaia-navy/20 hover:shadow-card-hover"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ajaia-navy-muted px-2.5 py-1 text-xs font-medium text-ajaia-navy">
                  <Users className="h-3 w-3" strokeWidth={2} />
                  Shared by {document.ownerEmail}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{document.title}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                  Updated {formatTimestamp(document.updatedAt) || 'recently'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      </PageContainer>
    </>
  )
}
