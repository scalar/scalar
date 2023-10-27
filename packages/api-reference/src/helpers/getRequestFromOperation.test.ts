import { describe, expect, it } from 'vitest'

import type { TransformedOperation } from '../types'
import { getRequestFromOperation } from './getRequestFromOperation'

describe('getRequestFromOperation', () => {
  it('transforms a basic operation', () => {
    const request = getRequestFromOperation({
      httpVerb: 'GET',
      path: '/foobar',
    } as TransformedOperation)

    expect(request).toMatchObject({
      method: 'GET',
      path: '/foobar',
      postData: undefined,
    })
  })

  it('transforms a POST operation', () => {
    const request = getRequestFromOperation({
      httpVerb: 'POST',
      path: '/foobar',
    } as TransformedOperation)

    expect(request).toMatchObject({
      method: 'POST',
      path: '/foobar',
      postData: undefined,
    })
  })
})
