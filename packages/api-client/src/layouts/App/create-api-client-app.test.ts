import { describe, expect, it, vi } from 'vitest'

import { createApiClientApp } from './create-api-client-app'
import { enableConsoleWarn } from '@/vitest.setup'

describe('createApiClientApp', () => {
  it('renders something', async () => {
    vi.unmock('@/hooks/useSidebar')
    vi.unmock('@/hooks/useLayout')
    enableConsoleWarn()

    const element = document.createElement('div')
    element.id = 'scalar-client'
    document.body.appendChild(element)

    expect(element).not.toBeNull()
    expect(element.innerHTML).not.toContain('Request')

    createApiClientApp(element, {
      proxyUrl: 'https://proxy.scalar.com',
    })

    // Make sure we wait for the client to be mounted
    await vi.waitFor(() => expect(element.innerHTML).toContain('My First Request'), { timeout: 5000 })
  })
})
