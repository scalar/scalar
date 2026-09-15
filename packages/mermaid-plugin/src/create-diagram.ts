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
  element.style.cssText =
    'border:1px solid var(--scalar-border-color,#ddd);border-radius:var(--scalar-radius,3px);overflow:hidden;margin:16px 0;background:var(--scalar-background-1,#fff)'
  const toolbar = document.createElement('div')
  toolbar.setAttribute('role', 'toolbar')
  toolbar.setAttribute('aria-label', 'Diagram controls')
  toolbar.style.cssText = 'display:flex;gap:4px;padding:8px;border-bottom:1px solid var(--scalar-border-color,#ddd)'
  const viewport = document.createElement('div')
  viewport.tabIndex = 0
  viewport.setAttribute('aria-label', 'Diagram. Use arrow keys to pan.')
  viewport.style.cssText =
    'overflow:hidden;min-height:120px;max-height:520px;padding:16px;cursor:grab;touch-action:pan-y'
  const canvas = document.createElement('div')
  // Mermaid renders with securityLevel strict, sanitizing diagram HTML and disabling callbacks.
  canvas.innerHTML = svg
  canvas.style.cssText =
    'transform-origin:center;transition:transform 80ms linear;background:#fff;border-radius:3px;padding:8px'
  viewport.append(canvas)
  element.append(toolbar, viewport)
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
    control.style.cssText =
      'font:inherit;font-size:12px;padding:4px 8px;border:1px solid var(--scalar-border-color,#ddd);border-radius:var(--scalar-radius,3px);color:var(--scalar-color-1,#222);background:var(--scalar-background-1,#fff);cursor:pointer'
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
