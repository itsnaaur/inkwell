export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export function parseMdToTiptap(text: string) {
  const lines = text.split('\n')
  const content = lines.map((line) => {
    if (line.startsWith('### ')) {
      return {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: line.slice(4) }],
      }
    }
    if (line.startsWith('## ')) {
      return {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: line.slice(3) }],
      }
    }
    if (line.startsWith('# ')) {
      return {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: line.slice(2) }],
      }
    }
    if (line.trim() === '') {
      return { type: 'paragraph', content: [] }
    }
    return { type: 'paragraph', content: [{ type: 'text', text: line }] }
  })
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
