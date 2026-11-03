import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ShareApiReference from './ShareApiReference.vue'
import ShareApiReferenceCard from './ShareApiReferenceCard.vue'

enableAutoUnmount(afterEach)
afterEach(() => vi.restoreAllMocks())

const clickButton = async (label: string): Promise<void> => {
  const button = new DOMWrapper(document.body).findAll('button').find((item) => item.text() === label)
  expect(button?.text()).toBe(label)
  await button?.trigger('click')
  await flushPromises()
}

describe('ShareDocumentConfirmation', () => {
  it.each([
    ['toolbar', ShareApiReference],
    ['card', ShareApiReferenceCard],
  ] as const)('requires confirmation before the %s uploads a document', async (surface, component) => {
    const workspace = createWorkspaceStore()
    await workspace.addDocument({
      name: 'private-api',
      document: { openapi: '3.1.0', info: { title: 'Private API', version: '1' }, paths: {} },
    })
    workspace.update('x-scalar-active-document', 'private-api')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise(() => {
          // Keep the upload pending while checking that consent issued exactly one request.
        }),
    )
    mount(component, {
      props: {
        workspace,
        externalUrls: {
          apiBaseUrl: 'https://api.example.com',
          registryUrl: 'https://registry.example.com',
          dashboardUrl: 'https://dashboard.example.com',
          proxyUrl: '',
        },
      },
      attachTo: document.body,
    })

    if (surface === 'toolbar') {
      await clickButton('Share')
    }
    await clickButton('Upload Document')
    expect(document.body.textContent).toContain('available to anyone with its share link')
    expect(fetchMock).not.toHaveBeenCalled()
    await clickButton('Cancel')
    expect(fetchMock).not.toHaveBeenCalled()

    await clickButton('Upload Document')
    await clickButton('Upload and share')
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('https://api.example.com/core/share/upload/apis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: workspace.exportActiveDocument('json') }),
    })
  })
})
