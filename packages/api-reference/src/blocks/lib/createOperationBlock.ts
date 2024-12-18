import { OperationBlock } from '@/blocks/components/OperationBlock'
import { ERRORS, WARNINGS } from '@/blocks/constants'
import { createApp } from 'vue'

import type { StoreContext } from './createStore'

export type CreateOperationBlockOptions = {
  element?: HTMLElement | Element | string | null
  store: StoreContext
  location: `#/paths/${string}`
}

/**
 * Creates a new OpenAPI Operation embed
 *
 * @example
 * createOperationBlock({
 *   element: document.getElementById('scalar-api-reference'),
 *   store: createStore({ url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json' }),
 *   location: getLocation('GET', '/planets/1')
 * })
 */
export function createOperationBlock(options: CreateOperationBlockOptions) {
  // TODO: Implement
  const mount = (element?: CreateOperationBlockOptions['element']) => {
    // TODO: Implement
    if (!options.element && !element) {
      console.error(ERRORS.NO_ELEMENT_PROVIDED)
      return
    }

    let targetElement: CreateOperationBlockOptions['element'] =
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

    const app = createApp(OperationBlock, {
      store: options.store,
      location: options.location,
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
