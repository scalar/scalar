import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import OpenMCPButton from './OpenMCPButton.vue'

const { uploadMock } = vi.hoisted(() => ({ uploadMock: vi.fn() }))

vi.mock('@/helpers/upload-temp-document', () => ({
  uploadTempDocument: uploadMock,
}))

enableAutoUnmount(afterEach)

const externalUrls: ExternalUrls = {
  dashboardUrl: 'https://dash.acme.io',
  registryUrl: 'https://registry.acme.io',
  proxyUrl: 'https://proxy.acme.io',
  apiBaseUrl: 'https://api.acme.io',
}

const workspace = { exportActiveDocument: vi.fn(() => '{"openapi":"3.1.0"}') } as unknown as WorkspaceStore

const clickGenerate = async (url?: string) => {
  const wrapper = mount(OpenMCPButton, { props: { externalUrls, url, workspace } })
  const generate = wrapper.findAll('.scalar-mcp-layer-link').find((el) => el.text().includes('Generate MCP'))
  if (!generate) {
    throw new Error('Expected the Generate MCP row')
  }
  await generate.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.stubGlobal('location', { href: 'https://docs.acme.io/', origin: 'https://docs.acme.io' })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('OpenMCPButton', () => {
  it('opens the register link with createMcp=true for a public document url', async () => {
    const openMock = vi.fn()
    vi.stubGlobal('open', openMock)

    await clickGenerate('https://api.acme.io/openapi.json')

    expect(openMock).toHaveBeenCalledWith(
      'https://dash.acme.io/register?url=https%3A%2F%2Fapi.acme.io%2Fopenapi.json&createMcp=true',
      '_blank',
      'noopener',
    )
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('uploads the active document before opening when the url is inline', async () => {
    const tab = { opener: {}, location: { href: '' }, close: vi.fn() }
    vi.stubGlobal(
      'open',
      vi.fn(() => tab),
    )
    uploadMock.mockResolvedValue('https://tmp.acme.io/doc.json')

    await clickGenerate(undefined)

    expect(uploadMock).toHaveBeenCalledWith('{"openapi":"3.1.0"}', externalUrls)
    expect(tab.location.href).toBe(
      'https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json&createMcp=true',
    )
  })
})
