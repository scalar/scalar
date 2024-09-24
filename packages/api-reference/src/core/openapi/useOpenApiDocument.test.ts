import { describe, expect, it } from 'vitest'
import { type Ref, watch } from 'vue'

import { useOpenApiDocument } from './useOpenApiDocument'

describe('useOpenApiDocument', () => {
  it('has processing state', async () => {
    const { schema, state } = useOpenApiDocument({
      openapi: '3.1.0',
    })

    expect(state.value).toBe('processing')

    await waitFor(state, 'done')

    expect(schema.value).toStrictEqual({
      openapi: '3.1.0',
    })
  })

  it('has done state', async () => {
    const { state } = useOpenApiDocument({
      openapi: '3.1.0',
    })

    await waitFor(state, 'done')

    expect(state.value).toBe('done')
  })

  it('has schema', async () => {
    const { state, schema } = useOpenApiDocument({
      openapi: '3.1.0',
    })

    await waitFor(state, 'done')

    expect(schema.value).toStrictEqual({
      openapi: '3.1.0',
    })
  })
})

function waitFor(input: Ref<any>, expectedValue: any) {
  return new Promise<void>((resolve) => {
    const unwatch = watch(input, (newValue) => {
      if (newValue === expectedValue) {
        unwatch()
        resolve()
      }
    })
  })
}
