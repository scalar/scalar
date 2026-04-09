import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadDocument } from './download'

/**
 * Read UTF-8 text from a Blob in tests.
 * jsdom's `blob.text()` / `new Response(blob).text()` can yield `"[object Blob]"`; `arrayBuffer` is reliable.
 */
const readBlobBody = async (blob: Blob) => {
  if (typeof blob.arrayBuffer === 'function') {
    const buffer = await blob.arrayBuffer()
    return new TextDecoder().decode(buffer)
  }
  if (typeof blob.text === 'function') {
    return blob.text()
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

describe('downloadDocument', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
  let createElementSpy: ReturnType<typeof vi.spyOn>
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL')
    createElementSpy = vi.spyOn(document, 'createElement')
    dispatchEventSpy = vi.spyOn(EventTarget.prototype, 'dispatchEvent')
    removeSpy = vi.spyOn(Element.prototype, 'remove')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('downloads JSON when format is explicitly set to json', async () => {
    const yamlContent = `
openapi: 3.0.0
info:
  title: Scalar Galaxy
  version: 1.0.0
    `
    await downloadDocument(yamlContent, 'scalar-galaxy', 'json')

    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob
    expect(blobArg.type).toBe('application/json')

    const link = createElementSpy.mock.results.at(-1)!.value as HTMLAnchorElement
    expect(link.tagName.toLowerCase()).toBe('a')
    expect(link.download).toBe('scalar-galaxy.json')

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'click',
      }),
    )

    assert(createObjectURLSpy.mock.results.length > 0)
    const objectUrl = createObjectURLSpy.mock.results[0].value
    assert(typeof objectUrl === 'string')
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(objectUrl)
    expect(removeSpy).toHaveBeenCalled()
  })

  it('downloads YAML when format is explicitly set to yaml', async () => {
    const jsonContent = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'Scalar Galaxy',
        version: '1.0.0',
      },
    })

    await downloadDocument(jsonContent, 'scalar-galaxy', 'yaml')

    assert(createObjectURLSpy.mock.calls.length > 0)
    const blobArg = createObjectURLSpy.mock.calls[0]![0]
    assert(blobArg instanceof Blob)
    expect(blobArg.type).toBe('application/x-yaml')

    const link = createElementSpy.mock.results.at(-1)!.value as HTMLAnchorElement
    expect(link.download).toBe('scalar-galaxy.yaml')
  })

  it('defaults to JSON when no format is specified and content is JSON', async () => {
    const jsonContent = JSON.stringify({
      openapi: '3.0.0',
    })

    await downloadDocument(jsonContent, 'scalar-galaxy')

    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob
    expect(blobArg.type).toBe('application/json')

    const link = createElementSpy.mock.results.at(-1)!.value as HTMLAnchorElement
    expect(link.download).toBe('scalar-galaxy.json')
  })

  it('defaults to YAML when no format is specified and content is YAML', async () => {
    const yamlContent = 'openapi: 3.0.0'

    await downloadDocument(yamlContent, 'scalar-galaxy')

    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob
    expect(blobArg.type).toBe('application/x-yaml')

    const link = createElementSpy.mock.results.at(-1)!.value as HTMLAnchorElement
    expect(link.download).toBe('scalar-galaxy.yaml')
  })

  it('uses default filename when none is provided', async () => {
    await downloadDocument('{"test": true}')
    const link = createElementSpy.mock.results.at(-1)!.value as HTMLAnchorElement
    expect(link.download).toBe('openapi.json')
  })

  it('preserves YAML content verbatim when output format matches input format', async () => {
    const yamlWithComments = `# My API description
openapi: 3.0.0
info:
  title: Scalar Galaxy # inline comment
  version: 1.0.0
`
    await downloadDocument(yamlWithComments, 'scalar-galaxy', 'yaml')

    const blobArg = createObjectURLSpy.mock.calls.at(-1)![0] as Blob
    const text = await readBlobBody(blobArg)

    expect(text).toBe(yamlWithComments)
  })

  it('preserves JSON content verbatim when output format matches input format', async () => {
    const jsonContent = '{\n    "openapi":"3.0.0",\n    "info":{"title":"Test"}\n}'

    await downloadDocument(jsonContent, 'test')

    const blobArg = createObjectURLSpy.mock.calls.at(-1)![0] as Blob
    const text = await readBlobBody(blobArg)

    expect(text).toBe(jsonContent)
  })
})
