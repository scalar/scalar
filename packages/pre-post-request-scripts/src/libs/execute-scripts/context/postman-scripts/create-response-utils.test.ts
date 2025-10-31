import { beforeEach, describe, expect, it } from 'vitest'

import { createExtendedSynchronousResponse } from './create-response-utils'

describe('createExtendedSynchronousResponse', () => {
  let mockedResponse: Response

  beforeEach(() => {
    const responseText = JSON.stringify({ data: 'test' })

    mockedResponse = new Response(responseText, {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    })
  })

  it('parses JSON response correctly', async () => {
    const syncResponse = await createExtendedSynchronousResponse(mockedResponse)
    const result = syncResponse.json()
    expect(result).toEqual({ data: 'test' })
  })

  it('throws error for invalid JSON', async () => {
    const invalidResponse = new Response('invalid json')
    invalidResponse.text = () => Promise.resolve('invalid json')
    invalidResponse.json = () => Promise.reject(new Error('Response is not valid JSON'))

    const syncResponse = await createExtendedSynchronousResponse(invalidResponse)
    expect(() => syncResponse.json()).toThrow('Response is not valid JSON')
  })

  it('returns response text', async () => {
    const syncResponse = await createExtendedSynchronousResponse(mockedResponse)
    const result = syncResponse.text()
    expect(result).toBe('{"data":"test"}')
  })

  it('provides status code', async () => {
    const syncResponse = await createExtendedSynchronousResponse(mockedResponse)
    expect(syncResponse.code).toBe(200)
  })

  it('provides headers as object', async () => {
    const syncResponse = await createExtendedSynchronousResponse(mockedResponse)
    expect(syncResponse.headers['content-type']).toBe('application/json')
  })
})
