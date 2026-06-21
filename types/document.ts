/** Shared document shape used by list views, sidebar, and providers. */
export interface DocumentItem {
  id: string
  ownerId: string
  ownerEmail: string
  title: string
  content: unknown
  createdAt: unknown
  updatedAt: unknown
  isDeleted?: boolean
  deletedAt?: unknown
}
