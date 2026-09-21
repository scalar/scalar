import { computedAsync } from '@vueuse/core'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, reactive } from 'vue'

import { generateCodeSnippet } from './generate-code-snippet'
import { generateCodeSnippetAsync } from './generate-code-snippet-async'
import type { GenerateCodeSnippetProps } from './generate-code-snippet-with-plugin'

const options: GenerateCodeSnippetProps = {
  clientId: 'js/fetch',
  operation: { responses: { '200': { description: 'OK' } } },
  method: 'get',
  path: '/pets',
  server: { url: 'https://example.com' },
  customCodeSamples: [],
  contentType: undefined,
  example: undefined,
  securitySchemes: [],
}

describe('generate-code-snippet-async', () => {
  it('preserves the synchronous result', async () => {
    expect(await generateCodeSnippetAsync(options)).toBe(generateCodeSnippet(options))
  })

  it('returns custom samples without requiring a generator', async () => {
    expect(
      await generateCodeSnippetAsync({
        ...options,
        clientId: 'custom/python',
        customCodeSamples: [{ lang: 'python', source: 'sdk.pets.list()' }],
      }),
    ).toBe('sdk.pets.list()')
  })

  it('returns no snippet when no client is selected', async () => {
    expect(await generateCodeSnippetAsync({ ...options, clientId: undefined })).toBe('')
  })

  it('tracks nested request edits before awaiting the generator', async () => {
    const props = reactive({
      ...options,
      operation: {
        parameters: [{ name: 'q', in: 'query' as const, example: 'one', required: true }],
      },
    })
    const scope = effectScope()
    const code = scope.run(() => computedAsync(() => generateCodeSnippetAsync(props), ''))
    try {
      await vi.waitFor(() => expect(code?.value).toBe("fetch('https://example.com/pets?q=one')"))
      props.operation.parameters[0]!.example = 'two'
      await vi.waitFor(() => expect(code?.value).toBe("fetch('https://example.com/pets?q=two')"))
    } finally {
      scope.stop()
    }
  })
})
