import { afterEach, describe, expect, it, vi } from 'vitest'

import { stubDialogApi } from './stub-dialog'

describe('stub-dialog', () => {
  let restore: (() => void) | undefined

  afterEach(() => {
    restore?.()
    document.body.innerHTML = ''
  })

  it('opens and closes a dialog, dispatching close like a browser', () => {
    restore = stubDialogApi()
    const dialog = document.createElement('dialog')
    const onClose = vi.fn()
    dialog.addEventListener('close', onClose)

    dialog.showModal()
    expect(dialog.hasAttribute('open')).toBe(true)

    dialog.close()
    expect(dialog.hasAttribute('open')).toBe(false)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('focuses the first focusable element when asked to', () => {
    restore = stubDialogApi({ focusFirst: true })
    const dialog = document.createElement('dialog')
    dialog.innerHTML = '<p>Text</p><button>First</button><button>Second</button>'
    document.body.append(dialog)

    dialog.showModal()

    expect(document.activeElement?.textContent).toBe('First')
  })

  it('restores the prototype it replaced', () => {
    const before = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')

    stubDialogApi()()

    expect(Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')).toEqual(before)
  })
})
