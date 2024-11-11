import { describe, expect, it } from 'vitest'

import { createApiClientApp } from './create-api-client-app'

describe('createApiClientApp', () => {
  it('renders something', async () => {
    const element = document.createElement('div')
    expect(element).not.toBeNull()

    expect(element.innerHTML).not.toContain('request')

    createApiClientApp(element, {
      proxyUrl: 'https://proxy.scalar.com',
    })

    expect(element.innerHTML).toContain('request')
  })
})
