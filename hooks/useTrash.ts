'use client'

import { useDocumentsContext } from '@/hooks/DocumentsProvider'

export function useTrash() {
  const { trashed, trashLoading } = useDocumentsContext()

  return {
    trashed,
    loading: trashLoading,
  }
}
