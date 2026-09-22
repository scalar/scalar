import { type LoaderPlugin, resolveReferencePath } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import { shallowReactive } from 'vue'

import type { ExampleObject } from '@/schemas/v3.2/strict/openapi-document'

/** Download state lives outside the document so reading an example never creates an edit. */
export type ExternalExampleState = {
  status: 'idle' | 'loading' | 'loaded' | 'error'
  value?: unknown
  /** Preserve wire text when a 3.2 example also supplies structured data. */
  serializedValue?: string
  load: () => Promise<void>
}

/** A resolver belongs to one document revision and its configured transport. */
export type ExternalExampleResolver = (example: ExampleObject) => ExternalExampleState

/** Cache external payloads and in-flight requests without changing authored examples. */
export const createExternalExampleResolver = (
  options: Parameters<typeof fetchUrls>[0] & { origin?: string; fileLoader?: LoaderPlugin } = {},
): ExternalExampleResolver => {
  const loader = fetchUrls({ ...options, limit: 10 })
  const cache = new Map<string, ExternalExampleState>()
  return (example) => {
    if (example.value !== undefined || !example.externalValue) {
      return { status: 'loaded', value: example.value, load: () => Promise.resolve() }
    }
    const url = resolveReferencePath(options.origin ?? '', example.externalValue) ?? example.externalValue
    const cached = cache.get(url)
    if (cached) return cached
    let pending: Promise<void> | undefined
    const state = shallowReactive<ExternalExampleState>({
      status: 'idle',
      load: () => {
        if (pending) return pending
        if (state.status === 'loaded') return Promise.resolve()
        state.status = 'loading'
        pending = (async (): Promise<void> => {
          try {
            const selectedLoader = [loader, options.fileLoader].find((candidate) => candidate?.validate(url))
            const result = await selectedLoader?.exec(url)
            if (result?.ok) {
              state.serializedValue = typeof result.raw === 'string' ? result.raw : undefined
              state.value = result.data === undefined ? result.raw : result.data
              state.status = 'loaded'
            } else {
              state.status = 'error'
            }
          } catch {
            state.status = 'error'
          } finally {
            pending = undefined
          }
        })()
        return pending
      },
    })
    cache.set(url, state)
    return state
  }
}
