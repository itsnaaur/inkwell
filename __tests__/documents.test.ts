import { debounce, parseMdToTiptap } from '@/lib/utils'

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('runs once with the latest arguments after the delay', () => {
    const fn = jest.fn()
    const debounced = debounce(fn, 100)
    debounced('first')
    debounced('second')
    jest.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('second')
  })

  it('flush runs a pending call immediately and only once', () => {
    const fn = jest.fn()
    const debounced = debounce(fn, 100)
    debounced('pending')
    debounced.flush()
    expect(fn).toHaveBeenCalledWith('pending')
    jest.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('flush does nothing when no call is pending', () => {
    const fn = jest.fn()
    debounce(fn, 100).flush()
    expect(fn).not.toHaveBeenCalled()
  })
})

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

  it('converts bold and italic text to marks', () => {
    const result = parseMdToTiptap('Some **bold** and *italic* text')
    expect(result.content[0].content).toEqual([
      { type: 'text', text: 'Some ' },
      { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' and ' },
      { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
      { type: 'text', text: ' text' },
    ])
  })

  it('leaves literal asterisks alone', () => {
    const result = parseMdToTiptap('2 * 3 * 4')
    expect(result.content[0].content).toEqual([{ type: 'text', text: '2 * 3 * 4' }])
  })

  it('groups consecutive bullets into one list', () => {
    const result = parseMdToTiptap('- One\n- **Two**')
    expect(result.content).toHaveLength(1)
    expect(result.content[0].type).toBe('bulletList')
    expect(result.content[0].content).toEqual([
      {
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'One' }] }],
      },
      {
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Two', marks: [{ type: 'bold' }] }],
          },
        ],
      },
    ])
  })

  it('converts numbered lines and keeps the starting number', () => {
    const result = parseMdToTiptap('3. Three\n4. Four')
    expect(result.content[0].type).toBe('orderedList')
    expect(result.content[0].attrs).toEqual({ start: 3 })
    expect(result.content[0].content).toHaveLength(2)
  })

  it('handles Windows line endings', () => {
    const result = parseMdToTiptap('# Title\r\n- Item\r\n')
    expect(result.content[0].content).toEqual([{ type: 'text', text: 'Title' }])
    expect(result.content[1].type).toBe('bulletList')
  })
})
