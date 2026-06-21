'use client'

import { useEffect, useMemo, useRef } from 'react'
import Underline from '@tiptap/extension-underline'
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
import { saveDocumentContent } from '@/lib/documentContent'
import { EditorSkeleton } from '@/components/DocumentPageSkeleton'
import { debounce } from '@/lib/utils'

interface EditorProps {
  docId: string
  content: unknown
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
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
        active
          ? 'bg-ajaia-navy text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

export default function Editor({ docId, content, onSaveStatusChange }: EditorProps) {
  const onSaveStatusChangeRef = useRef(onSaveStatusChange)
  onSaveStatusChangeRef.current = onSaveStatusChange

  const saveContent = useMemo(
    () =>
      debounce(async (json: unknown) => {
        onSaveStatusChangeRef.current('saving')
        try {
          await saveDocumentContent(docId, json)
          onSaveStatusChangeRef.current('saved')
        } catch {
          onSaveStatusChangeRef.current('idle')
        }
      }, 1500),
    [docId]
  )

  const editor = useEditor(
    {
      extensions: [StarterKit, Underline],
      content: content ?? '',
      immediatelyRender: false,
      onUpdate: ({ editor: currentEditor }) => {
        saveContent(currentEditor.getJSON())
      },
    },
    [docId]
  )

  const hydratedForDoc = useRef<string | null>(null)

  useEffect(() => {
    if (!editor) return
    if (hydratedForDoc.current === docId) return
    editor.commands.setContent(content ?? '', { emitUpdate: false })
    hydratedForDoc.current = docId
  }, [editor, content, docId])

  if (!editor) {
    return <EditorSkeleton />
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 p-2.5">
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
        <span className="mx-1 h-6 w-px bg-slate-200" />
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
        <span className="mx-1 h-6 w-px bg-slate-200" />
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
        className="max-w-none px-6 py-6 text-slate-900 focus:outline-none [&_.ProseMirror]:min-h-[560px] [&_.ProseMirror]:text-slate-900 [&_.ProseMirror]:outline-none"
      />
    </div>
  )
}
