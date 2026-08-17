import { describe, expect, it } from 'vitest'

import { isPlainLeftClick } from './is-plain-left-click'

describe('is-plain-left-click', () => {
  it('returns true for an unmodified primary button click', () => {
    const event = new MouseEvent('click', { button: 0 })

    expect(isPlainLeftClick(event)).toBe(true)
  })

  it.each([
    ['metaKey', { metaKey: true }],
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
  ])('returns false when %s is held', (_name, init) => {
    const event = new MouseEvent('click', { button: 0, ...init })

    expect(isPlainLeftClick(event)).toBe(false)
  })

  it.each([
    ['middle', 1],
    ['right', 2],
  ])('returns false for a %s button click', (_name, button) => {
    const event = new MouseEvent('click', { button })

    expect(isPlainLeftClick(event)).toBe(false)
  })

  it('ignores whether the default has already been prevented', () => {
    const event = new MouseEvent('click', { button: 0, cancelable: true })
    event.preventDefault()

    // The click is still a plain left click; whether it has already been
    // handled is the caller's question, not this predicate's
    expect(isPlainLeftClick(event)).toBe(true)
  })
})
