import { afterEach, describe, expect, it } from 'vitest'

import { useShellPanel } from './use-shell-panel'

/** A button standing in for a toolbar toggle, focused like a click or keypress would */
const focusButton = (label: string): HTMLButtonElement => {
  const button = document.createElement('button')
  button.textContent = label
  document.body.append(button)
  button.focus()
  return button
}

/** The panel element the composable looks for by id */
const renderPanel = (id: string): HTMLElement => {
  const panel = document.createElement('aside')
  panel.id = id
  panel.append(document.createElement('button'))
  document.body.append(panel)
  return panel
}

describe('use-shell-panel', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('opens one panel at a time', () => {
    const { active, open } = useShellPanel('panel')

    expect(active.value).toBeUndefined()

    open('configure')
    expect(active.value).toBe('configure')

    open('share')
    expect(active.value).toBe('share')
  })

  it('toggles the open panel closed, and another one open', () => {
    const { active, toggle } = useShellPanel('panel')

    toggle('deploy')
    expect(active.value).toBe('deploy')

    toggle('sdk')
    expect(active.value).toBe('sdk')

    toggle('sdk')
    expect(active.value).toBeUndefined()
  })

  it('only asks for focus when the opener wants it', () => {
    const { focusRequest, open, close } = useShellPanel('panel')

    open('configure')
    expect(focusRequest.value).toBeUndefined()

    open('sdk', { focus: true })
    const first = focusRequest.value
    expect(first).toBeTypeOf('number')

    open('sdk', { focus: true })
    expect(focusRequest.value).not.toBe(first)

    close()
    expect(focusRequest.value).toBeUndefined()
  })

  it('gives focus back to the opener when closed from inside', () => {
    const { open, close } = useShellPanel('panel')
    const trigger = focusButton('Configure')

    open('configure')
    const panel = renderPanel('panel')
    panel.querySelector('button')!.focus()

    close({ restoreFocus: true })

    expect(document.activeElement).toBe(trigger)
  })

  it('keeps the original opener when switching panels from inside the panel', () => {
    const { open, close } = useShellPanel('panel')
    const trigger = focusButton('Share')

    open('share')
    const panel = renderPanel('panel')
    panel.querySelector('button')!.focus()
    open('deploy')

    close({ restoreFocus: true })

    expect(document.activeElement).toBe(trigger)
  })

  it('leaves focus alone when closed from the toolbar', () => {
    const { toggle } = useShellPanel('panel')
    const trigger = focusButton('Deploy')

    toggle('deploy')
    const other = focusButton('Elsewhere')
    toggle('deploy')

    expect(document.activeElement).toBe(other)
    expect(document.activeElement).not.toBe(trigger)
  })

  it('skips focus restoration when the opener is gone', () => {
    const { open, close } = useShellPanel('panel')
    const trigger = focusButton('Configure')

    open('configure')
    trigger.remove()

    expect(() => close({ restoreFocus: true })).not.toThrow()
    expect(document.activeElement).toBe(document.body)
  })
})
