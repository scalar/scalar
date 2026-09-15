// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderMermaid } from './render-mermaid'

const render = vi.hoisted(() => vi.fn())
vi.mock('mermaid', () => ({ default: { initialize: vi.fn(), render } }))

const createSource = (): HTMLElement => {
  const element = document.createElement('div')
  element.innerHTML = '<pre><code class="language-mermaid">graph LR; A--&gt;B</code></pre>'
  return element
}

describe('render-mermaid', () => {
  beforeEach(() => {
    render.mockReset()
  })

  it('replaces a rendered fence and restores its original source when cancelled', async () => {
    render.mockResolvedValue({ svg: '<svg></svg>' })
    const element = createSource()
    const source = element.firstElementChild
    const controller = new AbortController()
    const cleanup = await renderMermaid({ element, source: 'graph LR; A-->B', signal: controller.signal })
    expect(element.querySelectorAll('svg')).toHaveLength(1)
    expect(element.querySelectorAll('button')).toHaveLength(3)
    controller.abort()
    expect(element.firstElementChild).toBe(source)
    cleanup?.()
  })

  it('keeps the source when Mermaid rejects an invalid diagram', async () => {
    render.mockRejectedValue(new Error('Invalid diagram'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const element = createSource()
    const source = element.firstElementChild
    const controller = new AbortController()
    try {
      const cleanup = await renderMermaid({ element, source: '', signal: controller.signal })
      expect(element.firstElementChild).toBe(source)
      expect(element.querySelector('svg')).toBeNull()
      expect(error).toHaveBeenCalledTimes(1)
      cleanup?.()
    } finally {
      controller.abort()
      error.mockRestore()
    }
  })

  it('does not insert a diagram that finishes after cancellation', async () => {
    let finish: ((result: { svg: string }) => void) | undefined
    render.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const element = createSource()
    const source = element.firstElementChild
    const controller = new AbortController()
    const pending = renderMermaid({ element, source: '', signal: controller.signal })
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1))
    controller.abort()
    finish?.({ svg: '<svg></svg>' })
    const cleanup = await pending
    expect(element.firstElementChild).toBe(source)
    expect(element.querySelector('svg')).toBeNull()
    cleanup?.()
  })
})
