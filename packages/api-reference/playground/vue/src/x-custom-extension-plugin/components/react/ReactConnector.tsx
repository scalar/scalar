import type { Component } from 'react'
import { type Root, createRoot } from 'react-dom/client'

export class ReactConnector {
  private static roots = new Map<HTMLElement, Root>()

  private root: Root
  private component: Component

  constructor(targetEl: HTMLElement, component: Component) {
    // Reuse existing root if one exists for this element
    const existingRoot = ReactConnector.roots.get(targetEl)

    if (existingRoot) {
      this.root = existingRoot
    } else {
      this.root = createRoot(targetEl)
      ReactConnector.roots.set(targetEl, this.root)
    }

    this.component = component
  }

  render(props: Record<string, unknown>) {
    // @ts-expect-error We don’t know the type.
    this.root.render(<this.component {...props} />)
  }
}
