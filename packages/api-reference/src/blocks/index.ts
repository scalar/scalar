const ERRORS = {
  NO_ELEMENT_PROVIDED:
    'Scalar Blocks: No HTML element provided to mount operation block.',
}

const WARNINGS = {
  ELEMENT_NOT_FOUND:
    'Scalar Blocks: HTML element not found. We’ll just create one and append it to the body.',
}

/**
 * Encodes a location string with paths
 *
 * @example
 * getLocation('GET', '/planets/1')
 *
 * '#/paths/get/~1planets~1{foo}'
 */
export function getLocation(method: string, path: string): `#/${string}` {
  const encodedPath = path.replace(/\//g, '~1')

  return `#/${method}/${encodedPath}`
}

export type StoreContext = {
  url: string
}

export type CreateStoreOptions = {
  url: string
  // TODO: content?
}

/**
 * Creates a store context holding the API definition
 *
 * @example
 * createStore({
 *   url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json'
 * })
 */
export function createStore(options: CreateStoreOptions): {
  store: StoreContext
} {
  // TODO: Implement

  const store = {
    url: options.url,
  }

  return {
    store,
  }
}

export type CreateOperationBlockOptions = {
  element?: HTMLElement | Element | string | null
  store: StoreContext
  location: `#/${string}`
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

    // TODO: Implement
    targetElement.textContent = 'TODO: Operation Block Content'
  }

  return {
    mount,
  }
}
