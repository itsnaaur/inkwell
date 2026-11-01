export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) & { flush: () => void } {
  let timeout: ReturnType<typeof setTimeout>
  let pendingArgs: Parameters<T> | null = null

  const flush = () => {
    clearTimeout(timeout)
    if (!pendingArgs) return
    const args = pendingArgs
    pendingArgs = null
    fn(...args)
  }

  const debounced = (...args: Parameters<T>) => {
    pendingArgs = args
    clearTimeout(timeout)
    timeout = setTimeout(flush, delay)
  }

  return Object.assign(debounced, { flush })
}

interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: { type: string }[]
  text?: string
}

function parseInlineMarkdown(text: string): TiptapNode[] {
  const pattern = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(\S(?:.*?\S)?)\*/g
  const nodes: TiptapNode[] = []
  let lastIndex = 0

  for (const match of Array.from(text.matchAll(pattern))) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }
    if (match[1]) {
      nodes.push({ type: 'text', text: match[1], marks: [{ type: 'bold' }, { type: 'italic' }] })
    } else if (match[2]) {
      nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] })
    } else {
      nodes.push({ type: 'text', text: match[3], marks: [{ type: 'italic' }] })
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }
  return nodes
}

export function parseMdToTiptap(text: string) {
  const content: TiptapNode[] = []

  // Consecutive list lines share one list node; nesting is flattened.
  const addListItem = (listType: string, itemText: string, attrs?: Record<string, unknown>) => {
    const item: TiptapNode = {
      type: 'listItem',
      content: [{ type: 'paragraph', content: parseInlineMarkdown(itemText) }],
    }
    const previous = content[content.length - 1]
    if (previous?.type === listType) {
      previous.content?.push(item)
    } else {
      content.push({ type: listType, ...(attrs && { attrs }), content: [item] })
    }
  }

  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,3}) (.*)$/)
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/)
    const ordered = line.match(/^\s*(\d+)[.)]\s+(.*)$/)

    if (heading) {
      content.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: parseInlineMarkdown(heading[2]),
      })
    } else if (bullet) {
      addListItem('bulletList', bullet[1])
    } else if (ordered) {
      addListItem('orderedList', ordered[2], { start: Number(ordered[1]) })
    } else if (line.trim() === '') {
      content.push({ type: 'paragraph', content: [] })
    } else {
      content.push({ type: 'paragraph', content: parseInlineMarkdown(line) })
    }
  }

  return { type: 'doc', content }
}

export function parseTxtToTiptap(text: string) {
  const lines = text.split('\n')
  const content = lines.map((line) => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : [],
  }))
  return { type: 'doc', content }
}

export function formatTimestamp(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const timestamp = value as { toDate?: () => Date }
  if (typeof timestamp.toDate !== 'function') return ''
  return timestamp.toDate().toLocaleString()
}
