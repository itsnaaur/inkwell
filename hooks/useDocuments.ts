'use client'

import { useDocumentsContext } from '@/providers/DocumentsProvider'
import type { DocumentItem } from '@/types/document'

export type { DocumentItem }

export function useDocuments() {
  const { owned, shared, ownedLoading, sharedLoading, sharedError } = useDocumentsContext()

  return {
    owned,
    shared,
    ownedLoading,
    sharedLoading,
    sharedError,
    loading: ownedLoading || sharedLoading,
  }
}
