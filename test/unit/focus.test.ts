import { describe, expect, it } from 'vitest'
import { nextTabbable, pickFocusId } from '@/utils/focus'

describe('pickFocusId (#39)', () => {
  const before = ['a', 'b', 'c', 'd']

  it('keeps focus on the item when it is still listed (e.g. moved within the list)', () => {
    expect(pickFocusId('b', before, ['a', 'c', 'd', 'b'])).toBe('b')
  })

  it('moves to the next item when the item left the list', () => {
    expect(pickFocusId('b', before, ['a', 'c', 'd'])).toBe('c')
  })

  it('moves to the previous item when the last item left', () => {
    expect(pickFocusId('d', before, ['a', 'b', 'c'])).toBe('c')
  })

  it('skips neighbours that left too', () => {
    expect(pickFocusId('b', before, ['a', 'd'])).toBe('d')
    expect(pickFocusId('d', before, ['a'])).toBe('a')
  })

  it('returns null when nothing is left', () => {
    expect(pickFocusId('a', ['a'], [])).toBeNull()
  })
})

describe('nextTabbable (#41)', () => {
  const setup = () => {
    document.body.innerHTML = `
      <button id="before">before</button>
      <button id="handle">handle</button>
      <button id="skip" tabindex="-1">not in the tab order</button>
      <button id="off" disabled>disabled</button>
      <div hidden><button id="hidden">hidden</button></div>
      <a id="link" href="/x">link</a>
      <input id="last" />
    `
    return (id: string) => document.getElementById(id)!
  }
  // happy-dom has no layout, so tests decide visibility
  const visible = (el: HTMLElement) => !el.closest('[hidden]')

  it('finds the next element in the tab order, skipping ones you cannot tab to', () => {
    const $ = setup()
    expect(nextTabbable($('handle'), 1, visible)).toBe($('link'))
  })

  it('finds the previous one for Shift+Tab', () => {
    const $ = setup()
    expect(nextTabbable($('handle'), -1, visible)).toBe($('before'))
  })

  it('returns null at either end', () => {
    const $ = setup()
    expect(nextTabbable($('last'), 1, visible)).toBeNull()
    expect(nextTabbable($('before'), -1, visible)).toBeNull()
  })
})
