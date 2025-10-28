import type { InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import InfoBlock from './InfoBlock.vue'

describe('InfoBlock', () => {
  const mockInfo: InfoObject = {
    title: 'Test API',
    version: '1.0.0',
  }

  it('uses "after" slot for classic layout', () => {
    const wrapper = mount(InfoBlock, {
      props: {
        info: mockInfo,
        layout: 'classic',
        options: {
          headingSlugGenerator: () => '',
        },
        eventBus: null,
      },
      slots: {
        selectors: '<div data-testid="selectors">Selectors Content</div>',
      },
    })

    expect(wrapper.find('[data-testid="selectors"]').exists()).toBe(true)
  })

  it('uses "aside" slot for modern layout', () => {
    const wrapper = mount(InfoBlock, {
      props: {
        info: mockInfo,
        layout: 'modern',
        options: {
          headingSlugGenerator: () => '',
        },
        eventBus: null,
      },
      slots: {
        selectors: '<div data-testid="selectors">Selectors Content</div>',
      },
    })

    expect(wrapper.find('[data-testid="selectors"]').exists()).toBe(true)
  })
})
