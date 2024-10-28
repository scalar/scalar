import galaxyContent from '@scalar/galaxy/latest.yaml?raw'
import { afterAll, describe, expect, it } from 'vitest'
import MatchMediaMock from 'vitest-matchmedia-mock'

import { waitFor } from './helpers/waitFor'
import type { ReferenceProps } from './types'

/**
 * Tests for standalone
 */
describe('Standalone API References', { retry: 3 }, () => {
  const matchMediaMock = new MatchMediaMock()

  afterAll(() => {
    matchMediaMock.clear()
  })

  it('Renders and updates the standalone reference', async () => {
    /*
     * renders very basic references with standalone
     */
    const script = document.createElement('script')
    script.id = 'api-reference'
    script.type = 'application/json'

    const inlineCode = document.createTextNode(
      `{ "openapi": "3.1.0", "info": { "title": "Example" }, "paths": {} }`,
    )
    script.appendChild(inlineCode)
    document.body.appendChild(script)

    await import('./standalone')

    await waitFor(() => {
      const reference = document.querySelector('.scalar-api-reference')
      const header = reference?.querySelector('h1')
      return header?.innerHTML === 'Example'
    })

    const rootElement1 = document.querySelector('[data-v-app]')
    const reference1 = rootElement1?.querySelector('.scalar-api-reference')
    const header1 = reference1?.querySelector('h1')

    expect(rootElement1?.contains(reference1!)).toBeTruthy()
    expect(header1?.innerHTML).toEqual('Example')

    /*
     * removes the app element and reloads
     */
    let rootElement2 = document.querySelector('[data-v-app]')
    rootElement2?.parentNode?.removeChild(rootElement2)

    expect(document.body.contains(rootElement2!)).toBeFalsy()
    expect(document.querySelector('[data-v-app]')).toBeNull()

    document.dispatchEvent(new Event('scalar:reload-references'))

    await waitFor(() => {
      const reference = document.querySelector('.scalar-api-reference')
      const header = reference?.querySelector('h1')
      return header?.innerHTML === 'Example'
    })

    rootElement2 = document.querySelector('[data-v-app]')
    const reference2 = rootElement2?.querySelector('.scalar-api-reference')
    const header2 = reference2?.querySelector('h1')

    expect(rootElement2?.contains(reference2!)).toBeTruthy()
    expect(header2?.innerHTML).toEqual('Example')

    /*
     * updates the spec url, detect for changes
     */
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

    await waitFor(() => {
      const header = document.querySelector('[data-v-app] h1')
      return header?.innerHTML === 'Scalar Galaxy'
    })

    const rootElement3 = document.querySelector('[data-v-app]')
    const header3 = rootElement3?.querySelector('h1')
    expect(header3?.innerHTML).toEqual('Scalar Galaxy')
  })
})
