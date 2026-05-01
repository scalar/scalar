import { afterEach, describe, expect, it, vi } from 'vitest'

import { refocusBlurTarget } from './refocus-blur-target'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('refocusBlurTarget', () => {
  it('does nothing when given a null selector', () => {
    const querySelector = vi.spyOn(document, 'querySelector')
    refocusBlurTarget(null)
    expect(querySelector).not.toHaveBeenCalled()
  })

  it('does nothing when the selector matches no element', () => {
    expect(() => refocusBlurTarget('#does-not-exist')).not.toThrow()
  })

  it('clicks a matching button element', () => {
    const button = document.createElement('button')
    button.id = 'target'
    document.body.appendChild(button)
    const click = vi.spyOn(button, 'click')

    refocusBlurTarget('#target')

    expect(click).toHaveBeenCalledTimes(1)
  })

  it('focuses a matching input element', () => {
    const input = document.createElement('input')
    input.id = 'target'
    document.body.appendChild(input)
    const focus = vi.spyOn(input, 'focus')

    refocusBlurTarget('#target')

    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('focuses a matching textarea element', () => {
    const textarea = document.createElement('textarea')
    textarea.id = 'target'
    document.body.appendChild(textarea)
    const focus = vi.spyOn(textarea, 'focus')

    refocusBlurTarget('#target')

    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('focuses a matching contenteditable element', () => {
    const editable = document.createElement('div')
    editable.id = 'target'
    editable.setAttribute('contenteditable', 'true')
    document.body.appendChild(editable)
    const focus = vi.spyOn(editable, 'focus')

    refocusBlurTarget('#target')

    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('ignores elements that are neither buttons nor editable', () => {
    const div = document.createElement('div')
    div.id = 'target'
    document.body.appendChild(div)
    const focus = vi.spyOn(div, 'focus')

    refocusBlurTarget('#target')

    expect(focus).not.toHaveBeenCalled()
  })
})
