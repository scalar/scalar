import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide } from 'vue'

import { STATE_SYMBOL, createState } from '@/state/state'

import { useUploadTmpDocument } from './use-upload-tmp-document'

enableAutoUnmount(afterEach)
afterEach(() => vi.restoreAllMocks())

describe('use-upload-tmp-document', () => {
  it.each(['preview', 'full'] as const)('requires confirmation at the upload boundary in %s mode', async (mode) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 400 }))
    const fixture: {
      state?: ReturnType<typeof createState>
      upload?: ReturnType<typeof useUploadTmpDocument>['uploadTempDocument']
    } = {}
    const child = defineComponent({
      setup() {
        fixture.upload = useUploadTmpDocument().uploadTempDocument
        return () => h('div')
      },
    })
    mount(
      defineComponent({
        setup() {
          fixture.state = createState({
            initialRegistryDocuments: [],
            registryUrl: 'https://registry.example.com',
            dashboardUrl: '',
            platformProxyUrl: '',
            baseUrl: 'https://api.example.com',
            mode,
          })
          provide(STATE_SYMBOL, fixture.state)
          return () => h(child)
        },
      }),
    )

    const cancelled = fixture.upload?.('{}', true)
    expect(fixture.state?.uploadConsent.modal.open).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    fixture.state?.uploadConsent.respond(false)
    await cancelled
    expect(fetchMock).not.toHaveBeenCalled()

    const accepted = fixture.upload?.('{}', true)
    expect(fetchMock).not.toHaveBeenCalled()
    fixture.state?.uploadConsent.respond(true)
    await accepted
    expect(fetchMock.mock.calls.map(([url]) => url)).toStrictEqual([
      'https://api.example.com/core/share/upload/apis?source=agent',
    ])
  })
})
