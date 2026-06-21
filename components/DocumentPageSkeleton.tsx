import PageContainer from '@/components/PageContainer'

export function EditorSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="flex gap-2 border-b border-slate-100 bg-slate-50/80 p-2.5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-8 w-8 animate-pulse rounded-lg bg-slate-200/80" />
        ))}
      </div>
      <div className="space-y-4 px-6 py-6">
        <div className="h-8 w-2/5 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  )
}

export function DocumentPageSkeleton() {
  return (
    <PageContainer variant="editor">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-2/5 min-w-[220px] animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-3 h-6 w-36 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
      <EditorSkeleton />
    </PageContainer>
  )
}
