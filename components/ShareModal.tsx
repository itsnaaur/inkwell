'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { Mail, Share2, Users, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase/client'
import { backfillSharedDocumentAccess, grantSharedDocumentAccess } from '@/lib/sharing'
import Button from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  documentId: string
}

interface ShareRecord {
  email: string
}

export default function ShareModal({ open, onClose, documentId }: ShareModalProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingShares, setLoadingShares] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const loadShares = useCallback(async () => {
    if (!user) return

    setLoadingShares(true)
    setError('')

    try {
      const sharesSnapshot = await getDocs(
        collection(db, 'documents', documentId, 'shares')
      )
      setShares(
        sharesSnapshot.docs.map((shareDoc) => ({
          email: shareDoc.data().sharedWithEmail as string,
        }))
      )

      const parentData = (await getDoc(doc(db, 'documents', documentId))).data()
      if (parentData) {
        backfillSharedDocumentAccess(
          documentId,
          user.uid,
          user.email ?? String(parentData.ownerEmail ?? ''),
          String(parentData.title ?? 'Untitled Document'),
          parentData.updatedAt
        ).catch(() => {
          // Best-effort migration for older shares
        })
      }
    } catch {
      setError('Could not load shares.')
    } finally {
      setLoadingShares(false)
    }
  }, [documentId, user])

  useEffect(() => {
    if (!open) return
    loadShares()
  }, [documentId, open, loadShares])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    const normalizedEmail = email.trim().toLowerCase()

    try {
      if (normalizedEmail === user.email?.toLowerCase()) {
        setError('You already own this document.')
        return
      }

      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), where('email', '==', normalizedEmail))
      )

      if (usersSnapshot.empty) {
        setError('No account found with that email.')
        return
      }

      const targetUid = usersSnapshot.docs[0].id
      const shareRef = doc(db, 'documents', documentId, 'shares', targetUid)
      const existingShare = await getDoc(shareRef)

      if (existingShare.exists()) {
        setError('Already shared with this user.')
        return
      }

      const parentSnapshot = await getDoc(doc(db, 'documents', documentId))
      const parentData = parentSnapshot.data()

      await setDoc(shareRef, {
        sharedWith: targetUid,
        sharedWithEmail: normalizedEmail,
        grantedBy: user.uid,
        createdAt: serverTimestamp(),
        documentTitle: parentData?.title ?? 'Untitled Document',
        ownerEmail: user.email ?? parentData?.ownerEmail ?? '',
        ownerId: user.uid,
        documentUpdatedAt: parentData?.updatedAt ?? serverTimestamp(),
      })

      await grantSharedDocumentAccess(documentId, targetUid, {
        ownerId: user.uid,
        ownerEmail: user.email ?? parentData?.ownerEmail ?? '',
        title: parentData?.title ?? 'Untitled Document',
        updatedAt: parentData?.updatedAt,
      })

      setSuccess(`Shared with ${normalizedEmail}`)
      setEmail('')
      await loadShares()
    } catch {
      setError('Could not share document.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 shadow-card-hover">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ajaia-navy-muted text-ajaia-navy">
              <Share2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Share document</h2>
              <p className="mt-1 text-sm text-slate-500">Grant access by email address.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost !px-2 !py-2"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="share-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="share-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field"
            />
          </div>

          {success && (
            <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
              {success}
            </p>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" variant="primary" icon={Share2} fullWidth disabled={loading}>
            {loading ? 'Sharing...' : 'Share document'}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="h-4 w-4 text-ajaia-navy" strokeWidth={2} />
            Current shares
          </h3>
          {loadingShares ? (
            <LoadingState size="sm" label="Loading shares..." className="mt-3" />
          ) : shares.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No one has access yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {shares.map((share) => (
                <li
                  key={share.email}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ajaia-navy-muted text-ajaia-navy">
                    <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  {share.email}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
