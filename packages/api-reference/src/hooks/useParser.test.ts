import { parse } from '@scalar/swagger-parser'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useParser } from './useParser'

describe('useParser', () => {
  it('returns the content', async () => {
    const { parsedSpecRef } = useParser({
      input: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example', version: '1.0' },
        paths: {},
      }),
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpecRef.info.title).toBe('Example')
  })

  it('works with refs', async () => {
    const rawSpec = ref<string>(
      JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example', version: '1.0' },
        paths: {},
      }),
    )

    const { parsedSpecRef } = useParser({
      input: rawSpec,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpecRef.info.title).toBe('Example')
  })

  it('watches the ref', async () => {
    const rawSpec = ref<string>(
      JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Example', version: '1.0' },
        paths: {},
      }),
    )

    const { parsedSpecRef } = useParser({
      input: rawSpec,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpecRef.info.title).toBe('Example')

    rawSpec.value = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Foobar', version: '1.0' },
      paths: {},
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpecRef.info.title).toBe('Foobar')
  })

  it('deals with undefined input', async () => {
    const { parsedSpecRef } = useParser({})

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpecRef.info.title).toBe('')
  })

  it('deals with empty input', async () => {
    const { parsedSpecRef } = useParser({
      input: '',
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpecRef.info.title).toBe('')
  })

  it('returns errors', async () => {
    const { errorRef } = useParser({
      input: '{"foo}',
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(errorRef.value).toContain('YAMLParseError: Missing closing')
  })

  it('overwrites the ref', async () => {
    const { parsedSpecRef, overwriteParsedSpecRef } = useParser({})

    overwriteParsedSpecRef({
      info: { title: 'Example' },
    })

    expect(parsedSpecRef.info.title).toBe('Example')
  })
})
