import { ERRORS, WARNINGS } from '@/blocks/constants'
import type { BlockProps } from '@/blocks/hooks/useBlockProps'
import { type DefineComponent, createApp } from 'vue'

import type { StoreContext } from './createStore'

export type CreateBlockOptions = {
  element?: HTMLElement | Element | string | null
  store: StoreContext
  location: `#/${string}`
  collection?: string
}

/**
 * Creates a new embeddable block
 *
 * @example
 * createBlock(OperationBlock, {
 *   element: document.getElementById('scalar-api-reference'),
 *   store: createStore({ url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json' }),
 *   location: getPointer(['paths', '/planets/1', 'get'])
 * })
 */
export function createBlock(
  component: DefineComponent<BlockProps, any, any>,
  options: CreateBlockOptions,
): { mount: (element?: CreateBlockOptions['element']) => void } {
  // TODO: Implement
  const mount = (element?: CreateBlockOptions['element']) => {
    // TODO: Implement
    if (!options.element && !element) {
      console.error(ERRORS.NO_ELEMENT_PROVIDED)
      return
    }

    let targetElement: CreateBlockOptions['element'] =
      options.element || element

    // Check if targetElement is a string, and if so, query the DOM
    if (typeof targetElement === 'string') {
      targetElement = document.querySelector(targetElement)
    }

    if (!targetElement) {
      console.warn(WARNINGS.ELEMENT_NOT_FOUND)

      targetElement = document.createElement('div')
      targetElement.classList.add('scalar-operation-block')

      document.body.appendChild(targetElement)
    }

    // TODO: Check whether we can simplify this or streamline the names (should be client not app, right?)
    targetElement.classList.add('scalar-app')
    targetElement.classList.add('scalar-api-reference')
    // TODO: This should not be necessary
    targetElement.classList.add('light-mode')

    const app = createApp(component, {
      store: options.store,
      location: options.location,
      collection: options.collection,
    })

    app.mount(targetElement)
  }

  // If an element was provied, mount it
  if (options.element) {
    mount(options.element)
  }

  return {
    mount,
  }
}
