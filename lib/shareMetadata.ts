import {
  collection,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getSharedWithMeRef } from '@/lib/sharing'

interface ShareMetadataInput {
  title: string
  ownerEmail: string
  ownerId: string
  updatedAt?: unknown
}

export async function syncShareMetadata(documentId: string, metadata: ShareMetadataInput) {
  const sharesSnapshot = await getDocs(collection(db, 'documents', documentId, 'shares'))
  if (sharesSnapshot.empty) return

  const batch = writeBatch(db)
  const updatedAt = metadata.updatedAt ?? serverTimestamp()

  sharesSnapshot.docs.forEach((shareDoc) => {
    batch.update(shareDoc.ref, {
      documentTitle: metadata.title,
      ownerEmail: metadata.ownerEmail,
      ownerId: metadata.ownerId,
      documentUpdatedAt: updatedAt,
    })

    batch.set(
      getSharedWithMeRef(shareDoc.id, documentId),
      {
        documentId,
        ownerId: metadata.ownerId,
        ownerEmail: metadata.ownerEmail,
        title: metadata.title,
        updatedAt,
      },
      { merge: true }
    )
  })

  await batch.commit()
}
