'use client'

import { useDocumentsContext, type DocumentItem } from '@/hooks/DocumentsProvider'

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
