import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { getSharedWithMeRef, revokeAllSharedDocumentAccess, backfillSharedDocumentAccess } from '@/lib/sharing'
import { db } from '@/lib/firebase/client'

export const TRASH_RETENTION_DAYS = 30

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function getTimestampMillis(value: unknown): number | null {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis()
  }
  return null
}

export function getDaysUntilPermanentDelete(deletedAt: unknown): number | null {
  const deletedMs = getTimestampMillis(deletedAt)
  if (deletedMs === null) return null

  const expiresAt = deletedMs + TRASH_RETENTION_DAYS * MS_PER_DAY
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / MS_PER_DAY))
}

export function isTrashExpired(deletedAt: unknown): boolean {
  const daysLeft = getDaysUntilPermanentDelete(deletedAt)
  return daysLeft !== null && daysLeft === 0
}

export function isActiveDocument(document: { isDeleted?: boolean }): boolean {
  return document.isDeleted !== true
}

export async function backfillActiveDocumentFields(documentIds: string[]) {
  if (documentIds.length === 0) return

  await Promise.all(
    documentIds.map((documentId) =>
      updateDoc(doc(db, 'documents', documentId), { isDeleted: false })
    )
  )
}

export async function permanentlyDeleteDocument(documentId: string) {
  const [sharesSnapshot, contentSnapshot] = await Promise.all([
    getDocs(collection(db, 'documents', documentId, 'shares')),
    getDocs(collection(db, 'documents', documentId, 'content')),
  ])

  const batch = writeBatch(db)

  sharesSnapshot.docs.forEach((shareDoc) => {
    batch.delete(shareDoc.ref)
    batch.delete(getSharedWithMeRef(shareDoc.id, documentId))
  })

  contentSnapshot.docs.forEach((contentDoc) => {
    batch.delete(contentDoc.ref)
  })

  batch.delete(doc(db, 'documents', documentId))

  await batch.commit()
}

export async function moveDocumentToTrash(documentId: string) {
  await updateDoc(doc(db, 'documents', documentId), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await revokeAllSharedDocumentAccess(documentId)
}

export async function restoreDocument(documentId: string) {
  await updateDoc(doc(db, 'documents', documentId), {
    isDeleted: false,
    deletedAt: null,
    updatedAt: serverTimestamp(),
  })

  const parentSnapshot = await getDoc(doc(db, 'documents', documentId))
  const parentData = parentSnapshot.data()

  if (parentData) {
    await backfillSharedDocumentAccess(
      documentId,
      String(parentData.ownerId ?? ''),
      String(parentData.ownerEmail ?? ''),
      String(parentData.title ?? 'Untitled Document'),
      parentData.updatedAt
    )
  }
}

export async function purgeExpiredTrashDocuments(ownerId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, 'documents'),
      where('ownerId', '==', ownerId),
      where('isDeleted', '==', true)
    )
  )

  const expiredDocs = snapshot.docs.filter((documentSnap) =>
    isTrashExpired(documentSnap.data().deletedAt)
  )

  await Promise.all(
    expiredDocs.map((documentSnap) => permanentlyDeleteDocument(documentSnap.id))
  )
}
