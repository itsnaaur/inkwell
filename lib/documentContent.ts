/**
 * Document body persistence — content subcollection layer.
 *
 * CRITICAL: Editor JSON lives at /documents/{id}/content/main, not on the parent
 * document. List queries only read lightweight metadata (title, dates, flags).
 * loadDocumentContent() still reads legacy parent.content for older documents.
 */
import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

const CONTENT_DOC_ID = 'main'

export function getDocumentContentRef(documentId: string) {
  return doc(db, 'documents', documentId, 'content', CONTENT_DOC_ID)
}

export async function loadDocumentContent(
  documentId: string,
  legacyContent?: unknown
): Promise<unknown> {
  if (legacyContent !== undefined && legacyContent !== null) {
    return legacyContent
  }

  const contentSnapshot = await getDoc(getDocumentContentRef(documentId))
  if (!contentSnapshot.exists()) {
    return null
  }

  return contentSnapshot.data().body ?? null
}

export async function saveDocumentContent(documentId: string, content: unknown) {
  await setDoc(
    getDocumentContentRef(documentId),
    {
      body: content,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  // Strip legacy inline content from parent once migrated to subcollection.
  await updateDoc(doc(db, 'documents', documentId), {
    content: deleteField(),
    updatedAt: serverTimestamp(),
  })
}
