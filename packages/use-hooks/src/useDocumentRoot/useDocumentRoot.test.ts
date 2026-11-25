import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, provide } from 'vue'

import { DOCUMENT_ROOT_SYMBOL, useDocumentRoot } from './useDocumentRoot'

/** Mounts a component that reads the document root during setup */
const readRoot = (provided?: Document | ShadowRoot): Document | ShadowRoot | undefined => {
  let root: Document | ShadowRoot | undefined

  const Child = defineComponent({
    setup() {
      root = useDocumentRoot()
      return () => null
    },
  })

  const Parent = defineComponent({
    setup() {
      if (provided) {
        provide(DOCUMENT_ROOT_SYMBOL, provided)
      }
      return () => h(Child)
    },
  })

  mount(Parent).unmount()

  return root
}

describe('useDocumentRoot', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to the document when nothing is provided', () => {
    expect(readRoot()).toBe(document)
  })

  it('returns a provided shadow root to nested components', () => {
    const shadowRoot = document.createElement('div').attachShadow({ mode: 'open' })

    expect(readRoot(shadowRoot)).toBe(shadowRoot)
  })

  it('returns a root provided by a separately mounted app', () => {
    const shadowRoot = document.createElement('div').attachShadow({ mode: 'open' })
    let root: Document | ShadowRoot | undefined

    const app = createApp(
      defineComponent({
        setup() {
          root = useDocumentRoot()
          return () => null
        },
      }),
    )
    app.provide(DOCUMENT_ROOT_SYMBOL, shadowRoot)
    app.mount(document.createElement('div'))
    app.unmount()

    expect(root).toBe(shadowRoot)
  })

  it('falls back to the document outside of a component', () => {
    expect(useDocumentRoot()).toBe(document)
  })

  it('returns undefined when there is no document (SSR)', () => {
    vi.stubGlobal('document', undefined)

    expect(useDocumentRoot()).toBeUndefined()
  })
})
