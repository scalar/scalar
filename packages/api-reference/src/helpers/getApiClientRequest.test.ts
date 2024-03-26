import { useAuthenticationStore } from '@scalar/api-client'
import { describe, expect, it } from 'vitest'

import { useServerStore } from '../stores'
import { getApiClientRequest } from './getApiClientRequest'

const { server } = useServerStore()
const { authentication } = useAuthenticationStore()

describe('getApiClientRequest', () => {
  it('returns a basic request', () => {
    expect(
      getApiClientRequest({
        serverState: server,
        authenticationState: authentication,
        operation: {
          operationId: 'foobar',
          description: 'foobar',
          name: 'foobar',
          httpVerb: 'GET',
          path: '/foobar',
          information: {
            operationId: 'foobar',
          },
        },
      }),
    ).toMatchObject({
      id: 'foobar',
      name: 'foobar',
      path: '/foobar',
      type: 'GET',
      url: '',
    })
  })
})
