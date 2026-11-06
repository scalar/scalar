import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SdkInstallationInstructions from './SdkInstallationInstructions.vue'
import SdkInstallationMarkdown from './SdkInstallationMarkdown.vue'

const makeScheme = (token: string): SecuritySchemeObjectSecret => ({
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key',
  'x-scalar-secret-token': token,
  'x-scalar-credential-placeholders': { apiKey: { field: 'token' } },
})

describe('SdkInstallationMarkdown', () => {
  it('substitutes the legacy SDK source field through installation instructions', async () => {
    const wrapper = mount(SdkInstallationInstructions, {
      attachTo: document.body,
      props: {
        xScalarSdkInstallation: [{ lang: 'shell', source: 'configure {{apiKey}}' }],
        securitySchemes: [makeScheme('example-key')],
      },
    })
    try {
      await flushPromises()
      expect(wrapper.text()).toContain('configure ••••••••')
      expect(wrapper.text()).not.toContain('example-key')
      expect(wrapper.find('[aria-label="Copy code"]').exists()).toBe(true)
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps current credentials masked while copying their real value', async () => {
    const copied: string[] = []
    const execCommand = Object.getOwnPropertyDescriptor(document, 'execCommand')
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => {
        copied.push(document.querySelector<HTMLTextAreaElement>('textarea[readonly]')?.value ?? '')
        return true
      }),
    })
    const wrapper = mount(SdkInstallationMarkdown, {
      attachTo: document.body,
      props: { value: '```sh\nconfigure {{apiKey}}\n```', securitySchemes: [makeScheme('first-secret')] },
    })
    try {
      await flushPromises()
      expect(wrapper.text()).toContain('configure ••••••••')
      expect(wrapper.text()).not.toContain('first-secret')
      await wrapper.get('button').trigger('click')
      await flushPromises()
      expect(copied).toStrictEqual(['configure first-secret'])
      await wrapper.setProps({ securitySchemes: [makeScheme('second-secret')] })
      await flushPromises()
      expect(wrapper.text()).not.toContain('second-secret')
      await wrapper.get('button').trigger('click')
      await flushPromises()
      expect(copied).toStrictEqual(['configure first-secret', 'configure second-secret'])
      await wrapper.setProps({ securitySchemes: [] })
      await flushPromises()
      expect(wrapper.text()).toContain('configure {{apiKey}}')
      expect(wrapper.find('button').exists()).toBe(false)
    } finally {
      wrapper.unmount()
      if (execCommand) {
        Object.defineProperty(document, 'execCommand', execCommand)
      } else {
        Reflect.deleteProperty(document, 'execCommand')
      }
    }
  })
})
