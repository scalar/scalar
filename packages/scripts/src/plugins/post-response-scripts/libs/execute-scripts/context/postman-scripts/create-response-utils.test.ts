import { beforeEach, describe, expect, it } from 'vitest'
import { createResponseUtils } from './create-response-utils'

describe('createResponseUtils', () => {
  let mockResponse: Response
  let responseText: string

  beforeEach(() => {
    responseText = JSON.stringify({ data: 'test' })
    mockResponse = new Response(responseText, {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    })

    // Override the text() and json() methods to be synchronous
    mockResponse.text = () => Promise.resolve(responseText)
    mockResponse.json = () => Promise.resolve(JSON.parse(responseText))
  })

  it('parses JSON response correctly', async () => {
    const utils = createResponseUtils(mockResponse)
    // Wait for the text promise to resolve
    utils.text()
    const result = utils.json()
    expect(result).toEqual({ data: 'test' })
  })

  it('throws error for invalid JSON', async () => {
    const invalidResponse = new Response('invalid json')
    invalidResponse.text = () => Promise.resolve('invalid json')
    invalidResponse.json = () => Promise.reject(new Error('Response is not valid JSON'))

    const utils = createResponseUtils(invalidResponse)
    // Wait for the text promise to resolve
    utils.text()
    expect(() => utils.json()).toThrow('Response is not valid JSON')
  })

  it('returns response text', async () => {
    const utils = createResponseUtils(mockResponse)
    const result = utils.text()
    expect(result).toBe('{"data":"test"}')
  })

  it('provides status code', () => {
    const utils = createResponseUtils(mockResponse)
    expect(utils.code).toBe(200)
  })

  it('provides headers as object', () => {
    const utils = createResponseUtils(mockResponse)
    expect(utils.headers['content-type']).toBe('application/json')
  })
})
