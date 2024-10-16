import { describe, expect, it } from 'vitest'

import { createApiClientModal } from './create-api-client-modal'

describe('createApiClientModal', () => {
  it('renders something', async () => {
    const element = document.createElement('div')
    expect(element).not.toBeNull()

    expect(element.innerHTML).not.toContain('scalar-app')

    await createApiClientModal(element, {
      proxyUrl: 'https://proxy.scalar.com',
    })

    expect(element.innerHTML).toContain('scalar-app')
  })
})
