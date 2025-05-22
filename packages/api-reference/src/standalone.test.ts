import galaxyContent from '@scalar/galaxy/latest.yaml?raw'
import { describe, expect, it } from 'vitest'

import { waitFor } from '@test/utils/wait-for'
import type { ReferenceProps } from './types'

describe.sequential('standalone', { retry: 3, timeout: 10000 }, () => {
  // Generates the required script tag on the fly:
  //
  // <script id="api-reference" type="application/json">
  //   { "openapi": "3.1.0", "info": { "title": "Example" }, "paths": {} }
  // </script>
  it('renders a basic reference with the HTML API', async () => {
    const script = document.createElement('script')
    script.id = 'api-reference'
    script.type = 'application/json'

    const inlineCode = document.createTextNode(`{ "openapi": "3.1.0", "info": { "title": "Example" }, "paths": {} }`)
    script.appendChild(inlineCode)
    document.body.appendChild(script)

    await import('./standalone')

    await waitFor(() => {
      const reference = document.querySelector('.scalar-api-reference')
      const header = reference?.querySelector('h1')
      return header?.innerHTML === 'Example'
    })
  })

  it('reloads the reference after removing the app element', async () => {
    const rootElement = document.querySelector('[data-v-app]')
    rootElement?.parentNode?.removeChild(rootElement)

    expect(document.body.contains(rootElement!)).toBeFalsy()
    expect(document.querySelector('[data-v-app]')).toBeNull()

    document.dispatchEvent(new Event('scalar:reload-references'))

    await waitFor(() => {
      const reference = document.querySelector('.scalar-api-reference')
      const header = reference?.querySelector('h1')
      return header?.innerHTML === 'Example'
    })
  })

  it('updates when the configuration changes', async () => {
    const event = new CustomEvent('scalar:update-references-config', {
      detail: {
        configuration: {
          // @ts-expect-error old format
          spec: {
            content: galaxyContent,
          },
        },
      } satisfies ReferenceProps,
    })

    document.dispatchEvent(event)

    await waitFor(() => {
      const header = document.querySelector('[data-v-app] h1')
      return header?.innerHTML === 'Scalar Galaxy'
    })
  })
})
