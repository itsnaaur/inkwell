'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { sortByDeletedAt, sortByUpdatedAt, toListItem } from '@/lib/documentList'
import { isActiveDocument, purgeExpiredTrashDocuments, backfillActiveDocumentFields } from '@/lib/trash'
import { useAuth } from '@/hooks/useAuth'

export interface DocumentItem {
  id: string
  ownerId: string
  ownerEmail: string
  title: string
  content: unknown
  createdAt: unknown
  updatedAt: unknown
  isDeleted?: boolean
  deletedAt?: unknown
}

interface DocumentsContextValue {
  owned: DocumentItem[]
  shared: DocumentItem[]
  trashed: DocumentItem[]
  ownedLoading: boolean
  sharedLoading: boolean
  trashLoading: boolean
  ownedError: string
  sharedError: string
}

const DocumentsContext = createContext<DocumentsContextValue | undefined>(undefined)

function getPurgeSessionKey(userId: string) {
  return `ajaia-trash-purge-${userId}`
}

function mapSharedWithMeDocuments(
  snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }
) {
  return snapshot.docs.map((item) => {
    const data = item.data()
    return toListItem(item.id, {
      ownerId: data.ownerId ?? '',
      ownerEmail: data.ownerEmail ?? '',
      title: data.title ?? 'Untitled Document',
      updatedAt: data.updatedAt,
      createdAt: data.sharedAt,
    })
  })
}

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [owned, setOwned] = useState<DocumentItem[]>([])
  const [shared, setShared] = useState<DocumentItem[]>([])
  const [trashed, setTrashed] = useState<DocumentItem[]>([])
  const [ownedLoading, setOwnedLoading] = useState(true)
  const [sharedLoading, setSharedLoading] = useState(true)
  const [trashLoading, setTrashLoading] = useState(true)
  const [ownedError, setOwnedError] = useState('')
  const [sharedError, setSharedError] = useState('')

  useEffect(() => {
    if (!user) {
      setOwned([])
      setShared([])
      setTrashed([])
      setOwnedLoading(false)
      setSharedLoading(false)
      setTrashLoading(false)
      setOwnedError('')
      setSharedError('')
      return
    }

    setOwnedLoading(true)
    setSharedLoading(true)
    setTrashLoading(true)
    setOwnedError('')
    setSharedError('')

    const purgeKey = getPurgeSessionKey(user.uid)
    const today = new Date().toDateString()
    if (sessionStorage.getItem(purgeKey) !== today) {
      purgeExpiredTrashDocuments(user.uid)
        .then(() => sessionStorage.setItem(purgeKey, today))
        .catch(() => {
          // Ignore purge errors — lists still load
        })
    }

    const ownedQuery = query(
      collection(db, 'documents'),
      where('ownerId', '==', user.uid)
    )

    const trashQuery = query(
      collection(db, 'documents'),
      where('ownerId', '==', user.uid),
      where('isDeleted', '==', true)
    )

    const sharedQuery = collection(db, 'users', user.uid, 'sharedWithMe')

    const unsubscribeOwned = onSnapshot(
      ownedQuery,
      (snapshot) => {
        setOwnedError('')
        const docs = snapshot.docs
          .map((item) => toListItem(item.id, item.data()))
          .filter(isActiveDocument)
        setOwned(sortByUpdatedAt(docs))
        setOwnedLoading(false)

        const legacyDocumentIds = snapshot.docs
          .filter((item) => item.data().isDeleted === undefined)
          .map((item) => item.id)

        if (legacyDocumentIds.length > 0) {
          backfillActiveDocumentFields(legacyDocumentIds).catch(() => {
            // Backfill is best-effort — documents still display via client filter
          })
        }
      },
      (error) => {
        console.error('Failed to load owned documents:', error)
        setOwnedError(
          error.code === 'permission-denied'
            ? 'Could not load your documents. Publish the latest firestore.rules in Firebase Console, then refresh.'
            : 'Could not load your documents. Check your connection and try again.'
        )
        setOwnedLoading(false)
      }
    )

    const unsubscribeTrash = onSnapshot(
      trashQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((item) => toListItem(item.id, item.data()))
        setTrashed(sortByDeletedAt(docs))
        setTrashLoading(false)
      },
      () => setTrashLoading(false)
    )

    const unsubscribeShared = onSnapshot(
      sharedQuery,
      (snapshot) => {
        setSharedError('')
        setShared(sortByUpdatedAt(mapSharedWithMeDocuments(snapshot)))
        setSharedLoading(false)
      },
      (error) => {
        console.error('Failed to load shared documents:', error)
        setSharedError(
          error.code === 'permission-denied'
            ? 'Could not load shared documents. Publish the latest firestore.rules in Firebase Console.'
            : 'Could not load shared documents. Check your connection and try again.'
        )
        setSharedLoading(false)
      }
    )

    return () => {
      unsubscribeOwned()
      unsubscribeTrash()
      unsubscribeShared()
    }
  }, [user])

  return (
    <DocumentsContext.Provider
      value={{
        owned,
        shared,
        trashed,
        ownedLoading,
        sharedLoading,
        trashLoading,
        ownedError,
        sharedError,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  )
}

export function useDocumentsContext() {
  const context = useContext(DocumentsContext)
  if (!context) {
    throw new Error('useDocumentsContext must be used within DocumentsProvider')
  }
  return context
}
