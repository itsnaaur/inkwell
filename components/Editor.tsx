'use client'

/**
 * Tiptap editor — debounced autosave to content subcollection.
 *
 * Hydration runs once per document to avoid cursor jumps from snapshot updates.
 * Save debounce is 1500ms to limit Firestore write volume during typing.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from 'lucide-react'
import {
  DocumentConflictError,
  loadDocumentContent,
  saveDocumentContent,
} from '@/lib/documentContent'
import { EditorSkeleton } from '@/components/DocumentPageSkeleton'
import { debounce } from '@/lib/utils'

interface EditorProps {
  docId: string
  content: unknown
  revision: number
  onSaveStatusChange: (status: 'idle' | 'saving' | 'saved') => void
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-10 w-9 items-center justify-center rounded-lg transition sm:w-10 ${
        active
          ? 'bg-inkwell-navy text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

export default function Editor({ docId, content, revision, onSaveStatusChange }: EditorProps) {
  const onSaveStatusChangeRef = useRef(onSaveStatusChange)
  onSaveStatusChangeRef.current = onSaveStatusChange

  // Bumped on every edit so a finishing save can't report "saved" over newer changes.
  const editVersionRef = useRef(0)
  const hasUnsavedChangesRef = useRef(false)
  const baseRevisionRef = useRef(revision)
  const conflictRef = useRef(false)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const [saveProblem, setSaveProblem] = useState<'conflict' | 'failed' | null>(null)
  const [resolving, setResolving] = useState(false)

  const saveContent = useMemo(() => {
    const persist = async (json: unknown) => {
      if (conflictRef.current) return

      const savingVersion = editVersionRef.current
      try {
        baseRevisionRef.current = await saveDocumentContent(docId, json, baseRevisionRef.current)
        setSaveProblem(null)
        if (savingVersion !== editVersionRef.current) return
        hasUnsavedChangesRef.current = false
        onSaveStatusChangeRef.current('saved')
      } catch (error) {
        if (error instanceof DocumentConflictError) {
          conflictRef.current = true
          setSaveProblem('conflict')
          onSaveStatusChangeRef.current('idle')
          return
        }
        if (savingVersion !== editVersionRef.current) return
        setSaveProblem('failed')
        onSaveStatusChangeRef.current('idle')
      }
    }

    // Saves run one at a time so each builds on the revision the previous one wrote.
    return debounce((json: unknown) => {
      saveQueueRef.current = saveQueueRef.current.then(() => persist(json))
    }, 1500)
  }, [docId])

  const editor = useEditor(
    {
      extensions: [StarterKit],
      content: content ?? '',
      immediatelyRender: false,
      // Keeps toolbar active states in sync with the cursor position.
      shouldRerenderOnTransaction: true,
      onUpdate: ({ editor: currentEditor }) => {
        editVersionRef.current += 1
        hasUnsavedChangesRef.current = true
        if (conflictRef.current) return
        onSaveStatusChangeRef.current('saving')
        saveContent(currentEditor.getJSON())
      },
    },
    [docId]
  )

  // Save pending edits on in-app navigation and when the tab is hidden; warn before a reload or close.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveContent.flush()
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current) return
      saveContent.flush()
      event.preventDefault()
      event.returnValue = ''
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      saveContent.flush()
    }
  }, [saveContent])

  const hydratedForDoc = useRef<string | null>(null)

  // One-time content hydration per doc — prevents ProseMirror reset on parent re-renders.
  useEffect(() => {
    if (!editor) return
    if (hydratedForDoc.current === docId) return
    editor.commands.setContent(content ?? '', { emitUpdate: false })
    baseRevisionRef.current = revision
    hydratedForDoc.current = docId
  }, [editor, content, revision, docId])

  // Show someone else's saved changes when there is nothing local to lose.
  // With unsaved edits the next save detects the conflict instead.
  useEffect(() => {
    if (!editor || hydratedForDoc.current !== docId) return
    if (revision <= baseRevisionRef.current || hasUnsavedChangesRef.current) return

    const { from } = editor.state.selection
    editor.commands.setContent(content ?? '', { emitUpdate: false })
    editor.commands.setTextSelection(Math.min(from, editor.state.doc.content.size))
    baseRevisionRef.current = revision
  }, [editor, content, revision, docId])

  const resolveConflict = async (keepMine: boolean) => {
    if (!editor) return

    setResolving(true)
    saveContent.flush()
    await saveQueueRef.current

    try {
      const latest = await loadDocumentContent(docId)
      baseRevisionRef.current = latest.revision
      conflictRef.current = false
      setSaveProblem(null)
      editVersionRef.current += 1

      if (keepMine) {
        onSaveStatusChangeRef.current('saving')
        saveContent(editor.getJSON())
        saveContent.flush()
      } else {
        editor.commands.setContent(latest.body ?? '', { emitUpdate: false })
        hasUnsavedChangesRef.current = false
        onSaveStatusChangeRef.current('saved')
      }
    } catch {
      setSaveProblem('conflict')
    } finally {
      setResolving(false)
    }
  }

  const retrySave = () => {
    if (!editor) return
    setSaveProblem(null)
    onSaveStatusChangeRef.current('saving')
    saveContent(editor.getJSON())
    saveContent.flush()
  }

  if (!editor) {
    return <EditorSkeleton />
  }

  return (
    <div className="card overflow-clip">
      {saveProblem === 'conflict' && (
        <div role="alert" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>Someone else changed this document. Your latest edits have not been saved.</p>
          <div className="mt-2 flex flex-wrap gap-3 font-medium">
            <button
              type="button"
              disabled={resolving}
              onClick={() => resolveConflict(false)}
              className="underline disabled:opacity-50"
            >
              Load latest version
            </button>
            <button
              type="button"
              disabled={resolving}
              onClick={() => resolveConflict(true)}
              className="underline disabled:opacity-50"
            >
              Overwrite with my version
            </button>
          </div>
        </div>
      )}
      {saveProblem === 'failed' && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>Your latest edits could not be saved. Check your connection or access to this document.</p>
          <button type="button" onClick={retrySave} className="mt-2 font-medium underline">
            Try again
          </button>
        </div>
      )}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 p-2 sm:gap-1 sm:p-2.5">
        <ToolbarButton
          active={editor.isActive('bold')}
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('underline')}
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" strokeWidth={2} />
        </ToolbarButton>
        <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          label="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          label="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" strokeWidth={2} />
        </ToolbarButton>
        <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" strokeWidth={2} />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="max-w-none px-4 py-5 text-slate-900 sm:px-6 sm:py-6 focus:outline-none [&_.ProseMirror]:min-h-[560px] [&_.ProseMirror]:text-slate-900 [&_.ProseMirror]:outline-none"
      />
    </div>
  )
}
