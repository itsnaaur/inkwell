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
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

const CONTENT_DOC_ID = 'main'

/** Thrown when someone else saved since this editor last loaded the document. */
export class DocumentConflictError extends Error {}

export function getDocumentContentRef(documentId: string) {
  return doc(db, 'documents', documentId, 'content', CONTENT_DOC_ID)
}

export async function loadDocumentContent(
  documentId: string,
  legacyContent?: unknown
): Promise<{ body: unknown; revision: number }> {
  if (legacyContent !== undefined && legacyContent !== null) {
    return { body: legacyContent, revision: 0 }
  }

  const contentSnapshot = await getDoc(getDocumentContentRef(documentId))
  if (!contentSnapshot.exists()) {
    return { body: null, revision: 0 }
  }

  const data = contentSnapshot.data()
  return { body: data.body ?? null, revision: data.revision ?? 0 }
}

/**
 * Saves only if the stored revision still matches the one this editor loaded,
 * so one person's save can't silently replace another's. Returns the new revision.
 */
export async function saveDocumentContent(
  documentId: string,
  content: unknown,
  baseRevision: number
): Promise<number> {
  const contentRef = getDocumentContentRef(documentId)
  const nextRevision = baseRevision + 1

  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(contentRef)
    const currentRevision = current.exists() ? (current.data().revision ?? 0) : 0

    if (currentRevision !== baseRevision) {
      throw new DocumentConflictError()
    }

    transaction.set(
      contentRef,
      { body: content, revision: nextRevision, updatedAt: serverTimestamp() },
      { merge: true }
    )

    // Strip legacy inline content from parent once migrated to subcollection.
    transaction.update(doc(db, 'documents', documentId), {
      content: deleteField(),
      updatedAt: serverTimestamp(),
    })
  })

  return nextRevision
}
