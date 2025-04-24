import type { ComponentType } from 'react'
import { type Root, createRoot } from 'react-dom/client'

export class ReactConnector {
  private static roots = new Map<HTMLElement, Root>()

  private root: Root
  private component: ComponentType<any>

  constructor(targetEl: HTMLElement, component: ComponentType<any>) {
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
    const Component = this.component
    this.root.render(<Component {...props} />)
  }

  cleanup() {
    this.root.unmount()
  }
}
