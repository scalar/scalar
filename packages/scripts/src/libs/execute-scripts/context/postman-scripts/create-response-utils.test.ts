import { beforeEach, describe, expect, it } from 'vitest'
import { createExtendedSynchronousResponse } from './create-response-utils'

describe('createExtendedSynchronousResponse', () => {
  let mockedResponse: Response
  let responseText: string

  beforeEach(async () => {
    responseText = JSON.stringify({ data: 'test' })

    mockedResponse = new Response(responseText, {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    })
  })

  it('parses JSON response correctly', async () => {
    const utils = await createExtendedSynchronousResponse(mockedResponse)
    // Wait for the text promise to resolve
    utils.text()
    const result = utils.json()
    expect(result).toEqual({ data: 'test' })
  })

  it('throws error for invalid JSON', async () => {
    const invalidResponse = new Response('invalid json')
    invalidResponse.text = () => Promise.resolve('invalid json')
    invalidResponse.json = () => Promise.reject(new Error('Response is not valid JSON'))

    const utils = await createExtendedSynchronousResponse(invalidResponse)
    // Wait for the text promise to resolve
    utils.text()
    expect(() => utils.json()).toThrow('Response is not valid JSON')
  })

  it('returns response text', async () => {
    const utils = await createExtendedSynchronousResponse(mockedResponse)
    const result = utils.text()
    expect(result).toBe('{"data":"test"}')
  })

  it('provides status code', async () => {
    const utils = await createExtendedSynchronousResponse(mockedResponse)
    expect(utils.code).toBe(200)
  })

  it('provides headers as object', async () => {
    const utils = await createExtendedSynchronousResponse(mockedResponse)
    expect(utils.headers['content-type']).toBe('application/json')
  })
})
