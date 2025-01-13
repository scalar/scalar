import { describe, expect, it, vi } from 'vitest'

import { createOperationBlock } from './createOperationBlock'

describe('createOperationBlock', () => {
  const mockStore = {
    workspaces: {
      default: {
        uid: 'default',
      },
    },
  } as any

  it('returns a mount function', () => {
    const block = createOperationBlock({
      store: mockStore,
      location: '#/paths/get/test',
    })

    expect(block.mount).toBeDefined()
    expect(typeof block.mount).toBe('function')
  })

  it('logs error when no element is provided', () => {
    const consoleSpy = vi.spyOn(console, 'error')

    const block = createOperationBlock({
      store: mockStore,
      location: '#/paths/get/test',
    })

    block.mount()

    expect(consoleSpy).toHaveBeenCalledWith(
      'Scalar Blocks: No HTML element provided to mount operation block. Please provide an HTML element to mount the operation block into.',
    )
  })

  it('mounts to provided HTMLElement', () => {
    const element = document.createElement('div')

    const block = createOperationBlock({
      element,
      store: mockStore,
      location: '#/paths/get/test',
    })

    expect(element.classList.contains('scalar-app')).toBe(true)
    expect(element.classList.contains('scalar-api-reference')).toBe(true)
  })

  it('mounts to element when found by selector', () => {
    const element = document.createElement('div')
    element.id = 'test-element'
    document.body.appendChild(element)

    const block = createOperationBlock({
      element: '#test-element',
      store: mockStore,
      location: '#/paths/get/test',
    })

    expect(element.classList.contains('scalar-app')).toBe(true)
    expect(element.classList.contains('scalar-api-reference')).toBe(true)

    document.body.removeChild(element)
  })

  it('creates new element when selector not found', () => {
    const consoleSpy = vi.spyOn(console, 'warn')

    const block = createOperationBlock({
      element: '#non-existent',
      store: mockStore,
      location: '#/paths/get/test',
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      'Scalar Blocks: HTML element not found. We’ll just create one and append it to the body.',
    )

    const createdElement = document.querySelector('.scalar-operation-block')
    expect(createdElement).toBeTruthy()
    expect(createdElement?.classList.contains('scalar-app')).toBe(true)
    expect(createdElement?.classList.contains('scalar-api-reference')).toBe(
      true,
    )

    if (createdElement) {
      document.body.removeChild(createdElement)
    }
  })

  it('mounts immediately if element is provided in options', () => {
    const element = document.createElement('div')

    createOperationBlock({
      element,
      store: mockStore,
      location: '#/paths/get/test',
    })

    expect(element.classList.contains('scalar-app')).toBe(true)
    expect(element.classList.contains('scalar-api-reference')).toBe(true)
  })
})
