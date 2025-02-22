import { describe, expect, it, vi } from 'vitest'

import { createApiClientWeb } from './create-api-client-web'

describe('createApiClientWeb', () => {
  it('renders the client with no warnings or errors', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn')
    const consoleErrorSpy = vi.spyOn(console, 'error')

    const element = document.createElement('div')
    element.id = 'scalar-client'
    expect(element).not.toBeNull()

    expect(element.innerHTML).not.toContain('App Navigation')

    createApiClientWeb(element, {
      proxyUrl: 'https://proxy.scalar.com',
    })

    expect(element.innerHTML).toContain('App Navigation')

    // Make sure we wait for the client to be mounted
    await vi.waitFor(() => expect(element.innerHTML).toContain('My First Request'))

    // Make sure we didn't log any warnings or errors
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
