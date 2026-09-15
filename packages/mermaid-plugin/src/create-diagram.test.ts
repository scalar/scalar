// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { createDiagram } from './create-diagram'

describe('create-diagram', () => {
  it('zooms, pans with the keyboard, resets and restores the source on cleanup', () => {
    const container = document.createElement('div')
    const source = document.createElement('pre')
    source.textContent = 'graph LR; A-->B'
    container.append(source)
    const controller = new AbortController()
    const diagram = createDiagram('<svg aria-label="A to B"></svg>', source, controller.signal)
    source.replaceWith(diagram.element)
    const buttons = diagram.element.querySelectorAll('button')
    const viewport = diagram.element.querySelector<HTMLElement>('[tabindex="0"]')!
    const canvas = viewport.firstElementChild as HTMLElement
    buttons[0]!.click()
    expect(canvas.style.transform).toBe('translate(0px, 0px) scale(1.25)')
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(canvas.style.transform).toBe('translate(20px, 0px) scale(1.25)')
    buttons[2]!.click()
    expect(canvas.style.transform).toBe('translate(0px, 0px) scale(1)')
    controller.abort()
    buttons[0]!.click()
    expect(canvas.style.transform).toBe('translate(0px, 0px) scale(1)')
    diagram.destroy()
    expect(container.firstElementChild).toBe(source)
    expect(container.textContent).toBe('graph LR; A-->B')
  })
})
