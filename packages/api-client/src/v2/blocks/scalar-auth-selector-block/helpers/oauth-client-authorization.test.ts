import { decode } from 'js-base64'
import { describe, expect, it } from 'vitest'

import { oauthClientAuthorization } from './oauth-client-authorization'

describe('oauth-client-authorization', () => {
  it('form-encodes special characters before base64 encoding', () => {
    expect(decode(oauthClientAuthorization('client id:', 'secret +/~!').slice(6))).toBe(
      'client+id%3A:secret+%2B%2F%7E%21',
    )
  })
})
