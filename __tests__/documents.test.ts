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
})
