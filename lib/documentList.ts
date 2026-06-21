import type { DocumentItem } from '@/hooks/useDocuments'

export function getTimestampMillis(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis()
  }
  return 0
}

export function sortByUpdatedAt(docs: DocumentItem[]) {
  return [...docs].sort(
    (a, b) => getTimestampMillis(b.updatedAt) - getTimestampMillis(a.updatedAt)
  )
}

export function sortByDeletedAt(docs: DocumentItem[]) {
  return [...docs].sort(
    (a, b) => getTimestampMillis(b.deletedAt) - getTimestampMillis(a.deletedAt)
  )
}

export function toListItem(id: string, data: Record<string, unknown>): DocumentItem {
  return {
    id,
    ownerId: String(data.ownerId ?? ''),
    ownerEmail: String(data.ownerEmail ?? ''),
    title: String(data.title ?? 'Untitled Document'),
    content: null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    isDeleted: data.isDeleted === true,
    deletedAt: data.deletedAt,
  }
}
