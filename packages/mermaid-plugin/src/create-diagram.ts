import { diagramStyles } from './diagram-styles'

/** Create an accessible diagram viewer with zoom buttons and pointer panning. */
export const createDiagram = (
  svg: string,
  source: HTMLElement,
  signal: AbortSignal,
): {
  element: HTMLElement
  destroy: () => void
} => {
  const document = source.ownerDocument
  const element = document.createElement('section')
  element.setAttribute('aria-label', 'Mermaid diagram')
  element.setAttribute('data-markdown-block', '')
  element.className = 'scalar-mermaid-diagram'
  const style = document.createElement('style')
  style.textContent = diagramStyles
  const toolbar = document.createElement('div')
  toolbar.setAttribute('role', 'toolbar')
  toolbar.setAttribute('aria-label', 'Diagram controls')
  toolbar.className = 'scalar-mermaid-toolbar'
  const viewport = document.createElement('div')
  viewport.tabIndex = 0
  viewport.setAttribute('aria-label', 'Diagram. Use arrow keys to pan.')
  viewport.className = 'scalar-mermaid-viewport'
  const canvas = document.createElement('div')
  // Mermaid renders with securityLevel strict, sanitizing diagram HTML and disabling callbacks.
  canvas.innerHTML = svg
  canvas.className = 'scalar-mermaid-canvas'
  viewport.append(canvas)
  element.append(style, toolbar, viewport)
  let scale = 1
  let x = 0
  let y = 0
  const options = { signal }
  const update = (): void => {
    canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
  }
  const button = (label: string, action: () => void): void => {
    const control = document.createElement('button')
    control.type = 'button'
    control.textContent = label
    control.setAttribute('aria-label', label)
    control.className = 'scalar-mermaid-control'
    control.addEventListener('click', action, options)
    toolbar.append(control)
  }
  button('Zoom in', () => {
    scale = Math.min(4, scale * 1.25)
    update()
  })
  button('Zoom out', () => {
    scale = Math.max(0.25, scale / 1.25)
    update()
  })
  button('Reset view', () => {
    scale = 1
    x = 0
    y = 0
    update()
  })
  let pointer: { id: number; x: number; y: number } | undefined
  viewport.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      viewport.setPointerCapture(event.pointerId)
      viewport.style.cursor = 'grabbing'
    },
    options,
  )
  viewport.addEventListener(
    'pointermove',
    (event) => {
      if (pointer?.id !== event.pointerId) return
      x += event.clientX - pointer.x
      y += event.clientY - pointer.y
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      update()
    },
    options,
  )
  const endPan = (): void => {
    pointer = undefined
    viewport.style.cursor = 'grab'
  }
  viewport.addEventListener('pointerup', endPan, options)
  viewport.addEventListener('pointercancel', endPan, options)
  viewport.addEventListener('lostpointercapture', endPan, options)
  viewport.addEventListener(
    'keydown',
    (event) => {
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [20, 0],
        ArrowRight: [-20, 0],
        ArrowUp: [0, 20],
        ArrowDown: [0, -20],
      }
      const move = moves[event.key]
      if (!move) return
      event.preventDefault()
      x += move[0]
      y += move[1]
      update()
    },
    options,
  )
  return {
    element,
    destroy: () => {
      if (element.parentNode) element.replaceWith(source)
    },
  }
}
