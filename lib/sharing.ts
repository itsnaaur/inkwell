import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export interface SharedDocumentIndexEntry {
  documentId: string
  ownerId: string
  ownerEmail: string
  title: string
  updatedAt?: unknown
}

export function getSharedWithMeRef(userId: string, documentId: string) {
  return doc(db, 'users', userId, 'sharedWithMe', documentId)
}

export async function grantSharedDocumentAccess(
  documentId: string,
  targetUserId: string,
  metadata: Omit<SharedDocumentIndexEntry, 'documentId'>
) {
  await setDoc(getSharedWithMeRef(targetUserId, documentId), {
    documentId,
    ownerId: metadata.ownerId,
    ownerEmail: metadata.ownerEmail,
    title: metadata.title,
    updatedAt: metadata.updatedAt ?? serverTimestamp(),
    sharedAt: serverTimestamp(),
  })
}

export async function revokeSharedDocumentAccess(documentId: string, targetUserId: string) {
  await deleteDoc(getSharedWithMeRef(targetUserId, documentId))
}

export async function revokeAllSharedDocumentAccess(documentId: string) {
  const sharesSnapshot = await getDocs(
    collection(db, 'documents', documentId, 'shares')
  )

  if (sharesSnapshot.empty) return

  const batch = writeBatch(db)

  sharesSnapshot.docs.forEach((shareDoc) => {
    batch.delete(getSharedWithMeRef(shareDoc.id, documentId))
  })

  await batch.commit()
}

export async function backfillSharedDocumentAccess(
  documentId: string,
  ownerId: string,
  ownerEmail: string,
  title: string,
  updatedAt?: unknown
) {
  const sharesSnapshot = await getDocs(
    collection(db, 'documents', documentId, 'shares')
  )

  await Promise.all(
    sharesSnapshot.docs.map((shareDoc) =>
      grantSharedDocumentAccess(documentId, shareDoc.id, {
        ownerId,
        ownerEmail,
        title,
        updatedAt: updatedAt ?? shareDoc.data().documentUpdatedAt,
      })
    )
  )
}
