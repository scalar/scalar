import galaxyContent from '@scalar/galaxy/latest.yaml?raw'
import { afterAll, describe, expect, it } from 'vitest'
import MatchMediaMock from 'vitest-matchmedia-mock'

import { sleep } from './helpers'
import type { ReferenceProps } from './types'

/**
 * Tests for standalone
 * A bit hacky as we are working with the dom without jsdom, but works for these tests
 * as each test builds off the last
 */
describe('Standalone API References', () => {
  const matchMediaMock = new MatchMediaMock()

  afterAll(() => {
    matchMediaMock.clear()
  })

  it('renders very basic references with standalone', async () => {
    const script = document.createElement('script')
    script.id = 'api-reference'
    script.type = 'application/json'

    const inlineCode = document.createTextNode(
      `{ "openapi": "3.1.0", "info": { "title": "Example" }, "paths": {} }`,
    )
    script.appendChild(inlineCode)
    document.body.appendChild(script)

    await import('./standalone')
    await sleep(50)

    const rootElement = document.querySelector('[data-v-app]')
    const reference = rootElement?.querySelector('.scalar-api-reference')
    const h1 = reference?.querySelector('h1')

    expect(rootElement?.contains(reference!)).toBeTruthy()
    expect(h1?.innerHTML).toEqual('Example')
  })

  it('removes the app element and reloads', async () => {
    // Remove the main element
    let rootElement = document.querySelector('[data-v-app]')
    rootElement?.parentNode?.removeChild(rootElement)

    expect(document.body.contains(rootElement)).toBeFalsy()
    expect(document.querySelector('[data-v-app]')).toBeNull()

    // Now we use the event to re-load the app
    document.dispatchEvent(new Event('scalar:reload-references'))
    await sleep(50)

    rootElement = document.querySelector('[data-v-app]')
    const reference = rootElement?.querySelector('.scalar-api-reference')
    const h1 = reference?.querySelector('h1')

    expect(rootElement?.contains(reference!)).toBeTruthy()
    expect(h1?.innerHTML).toEqual('Example')
  })

  it('updates the spec url, detect for changes', async () => {
    // Update the config with the galaxy spec
    const ev = new CustomEvent('scalar:update-references-config', {
      detail: {
        configuration: {
          spec: {
            content: galaxyContent,
          },
        },
      } satisfies ReferenceProps,
    })
    document.dispatchEvent(ev)
    await sleep(50)

    const rootElement = document.querySelector('[data-v-app]')
    const h1 = rootElement?.querySelector('h1')

    expect(h1?.innerHTML).toEqual('Scalar Galaxy')
  })
})
