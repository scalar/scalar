import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import { useReactiveSpec } from './useReactiveSpec'

const basicSpec = {
  openapi: '3.1.0',
  info: { title: 'Example' },
  paths: {},
}

const basicSpecString = JSON.stringify(basicSpec)

describe('useReactiveSpec', () => {
  it('returns the content', async () => {
    const { rawSpec } = useReactiveSpec({
      content: basicSpecString,
    })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  it('returns an empty string', async () => {
    const { rawSpec } = useReactiveSpec({
      content: '',
    })

    await nextTick()

    expect(rawSpec.value).toBe('')
  })

  it('works with refs', async () => {
    const content = ref(basicSpecString)

    const { rawSpec } = useReactiveSpec({
      content,
    })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)
  })

  it('reacts to ref changes', async () => {
    const content = ref(basicSpecString)

    const { rawSpec } = useReactiveSpec({ content })

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString)

    // Change the content
    content.value = basicSpecString.replace('Example', 'My Changed Title')

    await nextTick()

    expect(rawSpec.value).toBe(basicSpecString.replace('Example', 'My Changed Title'))

    // Change the content to empty
    content.value = ''
    await nextTick()

    expect(rawSpec.value).toBe('')
  })

  it('returns the parsed content', async () => {
    const { parsedSpec } = useReactiveSpec({
      content: basicSpecString,
    })

    await nextTick()
    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(parsedSpec.info?.title).toBe('Example')
  })

  it('watches the ref', async () => {
    const content = ref(basicSpecString)

    const { parsedSpec } = useReactiveSpec({
      content,
    })

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info?.title).toBe('Example')

    content.value = basicSpecString.replace('Example', 'Foobar')

    // Sleep for 300ms to wait for the debouncer and the parser
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(parsedSpec.info?.title).toBe('Foobar')
  })

  it('deals with undefined input', async () => {
    const { parsedSpec } = useReactiveSpec({})

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info?.title).toBe('')
  })

  it('deals with empty input', async () => {
    const { parsedSpec } = useReactiveSpec({
      content: '',
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info?.title).toBe('')
  })

  it('returns errors', async () => {
    const { specErrors } = useReactiveSpec({
      content: '{"foo}',
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(specErrors.value).toContain('YAMLParseError')
  })

  it('resets schemas when the API definition changes', async () => {
    const content = ref(
      JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'API #1' },
        paths: {},
        components: {
          schemas: {
            Planet: { type: 'object' },
          },
        },
      }),
    )

    const { parsedSpec } = useReactiveSpec({
      content,
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(parsedSpec.info?.title).toBe('API #1')
    expect(parsedSpec.components?.schemas).toBeDefined()
    expect(Object.keys(parsedSpec.components?.schemas ?? {})).toStrictEqual(['Planet'])

    // Change the content
    content.value = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'API #2' },
      paths: {},
    })

    // Sleep for 10ms to wait for the parser to finish
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(parsedSpec.info?.title).toBe('API #2')
    expect(Object.keys(parsedSpec.components?.schemas ?? {})).toStrictEqual([])
  })
})
