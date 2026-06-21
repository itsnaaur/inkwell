'use client'

import { useDocumentsContext } from '@/providers/DocumentsProvider'

export function useTrash() {
  const { trashed, trashLoading } = useDocumentsContext()

  return {
    trashed,
    loading: trashLoading,
  }
}
