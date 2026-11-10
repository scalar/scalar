import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import App from './App.vue'

const props = {
  baseUrl: 'https://api.example.com',
  registryUrl: 'https://registry.example.com',
  dashboardUrl: 'https://dashboard.example.com',
  platformProxyUrl: '',
  registryDocuments: [],
  mode: 'preview' as const,
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('App', () => {
  it.each(['openapi', 'asyncapi'])(
    'uploads the current %s description after saved consent instead of restoring stale context',
    async (format) => {
      localStorage.setItem('scalar/agent-terms-accepted', 'true')
      localStorage.setItem('scalar-tmp-doc', JSON.stringify({ namespace: 'old', slug: 'old' }))
      const content = JSON.stringify({ [format]: '3.1.0', info: { title: 'Current', version: '1' } })
      const requests: { url: string; body: unknown }[] = []
      vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
        requests.push({ url: String(url), body: init?.body })
        return Promise.resolve(
          new Response(JSON.stringify({ results: [] }), { status: String(url).includes('/upload/') ? 400 : 200 }),
        )
      })
      const wrapper = mount(App, { props: { ...props, getActiveDocumentJson: () => content } })
      await flushPromises()
      expect(requests.filter(({ url }) => url.includes('/upload/'))).toStrictEqual([
        {
          url: 'https://api.example.com/core/share/upload/apis?source=agent',
          body: JSON.stringify({ document: content }),
        },
      ])
      expect(requests.some(({ url }) => url.includes('/old'))).toBe(false)
      expect(wrapper.text()).toContain('Failed to upload your API description.')
      wrapper.unmount()
    },
  )

  it('does not send a prefilled question before the user submits it', async () => {
    localStorage.setItem('scalar/agent-terms-accepted', 'true')
    const urls: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      urls.push(String(url))
      return Promise.resolve(new Response(JSON.stringify({ results: [] })))
    })
    const prefilledMessage = ref('')
    const wrapper = mount(App, { props: { ...props, prefilledMessage } })
    await flushPromises()
    prefilledMessage.value = 'Explain this channel'
    await flushPromises()
    expect(wrapper.get('textarea').element.value).toBe('Explain this channel')
    expect(urls.some((url) => url.endsWith('/chat'))).toBe(false)
    wrapper.unmount()
  })
})
