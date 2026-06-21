import { parseMdToTiptap } from '@/lib/utils'

describe('parseMdToTiptap', () => {
  it('converts # heading to tiptap heading level 1', () => {
    const result = parseMdToTiptap('# Hello World')
    expect(result.content[0]).toEqual({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Hello World' }],
    })
  })

  it('converts plain text to paragraph', () => {
    const result = parseMdToTiptap('Hello')
    expect(result.content[0].type).toBe('paragraph')
  })

  it('handles empty lines as empty paragraphs', () => {
    const result = parseMdToTiptap('Line one\n\nLine two')
    expect(result.content[1].content).toEqual([])
  })
})
