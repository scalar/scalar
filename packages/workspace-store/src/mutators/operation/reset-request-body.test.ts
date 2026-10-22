import { describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { updateOperationRequestBodyExample } from '@/mutators/operation/body'
import { resetOperationRequestBody } from '@/mutators/operation/reset-request-body'
import { getExampleFromBody } from '@/request-example/builder/body/get-request-body-example'
import { isOpenApiDocument } from '@/schemas/type-guards'
import type { ExampleObject, MediaTypeObject } from '@/schemas/v3.2/strict/openapi-document'

const meta = { path: '/items', method: 'post', exampleKey: 'selected' } as const
const contentType = 'application/json'
const reset = { documentName: 'api', meta, contentType }

const setup = async (media: MediaTypeObject = { examples: { selected: { value: { name: 'original' } } } }) => {
  const store = createWorkspaceStore()
  await store.addDocument({
    name: 'api',
    document: {
      openapi: '3.2.0',
      info: { title: 'Reset', version: '1' },
      paths: {
        '/items': {
          post: {
            parameters: [{ name: 'q', in: 'query', example: 'keep' }],
            requestBody: { content: { [contentType]: media, 'text/plain': { example: 'other type' } } },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
  })
  const document = store.workspace.documents.api
  if (!isOpenApiDocument(document)) {
    throw new Error('Missing document')
  }
  const operation = getResolvedRef(getResolvedRef(document.paths?.['/items'])?.post)
  if (!operation) {
    throw new Error('Missing operation')
  }
  const read = (): ExampleObject | null =>
    getExampleFromBody(getResolvedRef(operation.requestBody)!, contentType, meta.exampleKey)
  const edit = (payload: string): void => updateOperationRequestBodyExample(document, { meta, contentType, payload })
  return { store, document, operation, read, edit }
}

describe('reset-request-body', () => {
  it.each([false, 0, null, '', { name: 'original' }])(
    'restores the authored value %j without changing other request data',
    async (value) => {
      const { store, operation, read, edit } = await setup({
        examples: { selected: { value }, other: { value: 'keep' } },
      })
      edit('changed')
      await resetOperationRequestBody(store, reset)
      expect(read()?.value).toStrictEqual(value)
      expect(operation.parameters).toStrictEqual([{ name: 'q', in: 'query', example: 'keep' }])
      expect(getResolvedRef(operation.requestBody)?.content['text/plain']).toStrictEqual({ example: 'other type' })
      expect(getResolvedRef(operation.requestBody)?.content[contentType]?.examples?.other).toStrictEqual({
        value: 'keep',
      })
      edit('changed again')
      await resetOperationRequestBody(store, reset)
      expect(read()?.value).toStrictEqual(value)
    },
  )

  it.each(['application/xml', 'application/yaml', 'multipart/form-data', 'application/x-www-form-urlencoded'])(
    'restores an authored %s body',
    async (mediaType) => {
      const { store, operation, document } = await setup()
      const body = getResolvedRef(operation.requestBody)!
      body.content[mediaType] = {
        examples: { selected: { value: mediaType.includes('form') ? { name: 'original' } : 'original text' } },
      }
      await store.saveDocument('api')
      updateOperationRequestBodyExample(document, { meta, contentType: mediaType, payload: 'changed' })
      await resetOperationRequestBody(store, { ...reset, contentType: mediaType })
      expect(getResolvedRef(operation.requestBody)?.content[mediaType]?.examples?.selected).toStrictEqual({
        value: mediaType.includes('form') ? { name: 'original' } : 'original text',
      })
    },
  )

  it('restores configured overrides rather than the underlying document value', async () => {
    const { store } = await setup({ examples: { selected: { value: 'underlying' } } })
    await store.addDocument({
      name: 'api',
      document: store.getOriginalDocument('api')!,
      overrides: {
        paths: {
          '/items': {
            post: { requestBody: { content: { [contentType]: { examples: { selected: { value: 'configured' } } } } } },
          },
        },
      },
    })
    const document = store.workspace.documents.api
    if (!isOpenApiDocument(document)) {
      throw new Error('Missing document')
    }
    updateOperationRequestBodyExample(document, { meta, contentType, payload: 'changed' })
    await resetOperationRequestBody(store, reset)
    const body = getResolvedRef(getResolvedRef(getResolvedRef(document.paths?.['/items'])?.post)?.requestBody)
    expect(getExampleFromBody(body!, contentType, 'selected')?.value).toBe('configured')
  })

  it('restores media-level examples', async () => {
    const { store, read, edit } = await setup({ example: { name: 'media' } })
    edit('changed')
    await resetOperationRequestBody(store, reset)
    expect(read()?.value).toStrictEqual({ name: 'media' })
  })

  it('restores the last saved body', async () => {
    const { store, read, edit } = await setup()
    edit('saved')
    await store.saveDocument('api')
    edit('unsaved')
    await resetOperationRequestBody(store, reset)
    expect(read()?.value).toBe('saved')
  })

  it('regenerates the selected schema branch when there is no authored example', async () => {
    const { store, read, edit } = await setup({
      schema: {
        type: 'object',
        oneOf: [
          { type: 'object', properties: { first: { type: 'string', default: 'first' } } },
          { type: 'object', properties: { second: { type: 'string', default: 'second' } } },
        ],
      },
    })
    edit('changed')
    await resetOperationRequestBody(store, { ...reset, requestBodyCompositionSelection: { 'requestBody.oneOf': 1 } })
    expect(read()?.value).toStrictEqual({ second: 'second' })
  })

  it('clears bodies without an original example or schema', async () => {
    const { store, read, edit } = await setup({})
    edit('changed')
    await resetOperationRequestBody(store, reset)
    expect(read()?.value).toBe('')
  })

  it('preserves both authored data and serialization', async () => {
    const authored = { dataValue: { name: 'original' }, serializedValue: '{"name":"original"}' }
    const { store, operation, edit } = await setup({ examples: { selected: authored } })
    edit('changed')
    await resetOperationRequestBody(store, reset)
    expect(getResolvedRef(operation.requestBody)?.content[contentType]?.examples?.selected).toStrictEqual(authored)
  })

  it('resolves a saved reference without restoring other uses of it', async () => {
    const { store, document, operation, edit } = await setup({
      examples: {
        selected: { $ref: '#/paths/~1items/post/requestBody/content/application~1json/examples/other' },
        other: { value: 'original' },
      },
    })
    edit('changed')
    await resetOperationRequestBody(store, reset)
    expect(getResolvedRef(operation.requestBody)?.content[contentType]?.examples?.selected).toStrictEqual({
      value: 'original',
    })
    expect(getResolvedRef(operation.requestBody)?.content[contentType]?.examples?.other).toStrictEqual({
      value: 'changed',
    })
    expect(document.info.title).toBe('Reset')
  })

  it('resolves relative example references with the configured document transport', async () => {
    const store = createWorkspaceStore()
    const fetch = vi.fn(
      (): Promise<Response> =>
        Promise.resolve(new Response(JSON.stringify({ selected: { value: { name: 'remote original' } } }))),
    )
    await store.addDocument({
      name: 'api',
      documentSource: 'https://example.com/api/openapi.json',
      fetch,
      document: {
        openapi: '3.1.0',
        info: { title: 'Remote example', version: '1' },
        paths: {
          '/items': {
            post: {
              requestBody: {
                content: {
                  [contentType]: {
                    examples: {
                      selected: { $ref: './examples.json#/selected' },
                    },
                  },
                },
              },
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      },
    })
    const document = store.workspace.documents.api
    if (!isOpenApiDocument(document)) {
      throw new Error('Missing document')
    }
    updateOperationRequestBodyExample(document, { meta, contentType, payload: 'changed' })
    await resetOperationRequestBody(store, reset)
    const body = getResolvedRef(getResolvedRef(getResolvedRef(document.paths?.['/items'])?.post)?.requestBody)
    expect(getExampleFromBody(body!, contentType, 'selected')?.value).toStrictEqual({ name: 'remote original' })
    expect(fetch.mock.calls.length).toBe(2)
  })

  it('leaves typing that occurs during baseline resolution intact', async () => {
    const { store, read, edit } = await setup()
    edit('before reset')
    const pending = resetOperationRequestBody(store, reset)
    edit('new typing')
    await pending
    expect(read()?.value).toBe('new typing')
  })

  it('preserves the saved baseline through workspace hydration', async () => {
    const { store, edit } = await setup()
    edit('changed')
    const loaded = createWorkspaceStore()
    loaded.loadWorkspace(store.exportWorkspace())
    await resetOperationRequestBody(loaded, reset)
    const document = loaded.workspace.documents.api
    if (!isOpenApiDocument(document)) {
      throw new Error('Missing document')
    }
    const body = getResolvedRef(getResolvedRef(getResolvedRef(document.paths?.['/items'])?.post)?.requestBody)
    expect(getExampleFromBody(body!, contentType, 'selected')?.value).toStrictEqual({ name: 'original' })
  })
})
