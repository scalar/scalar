import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Models from './Models.vue'

describe('Models', () => {
  const mockDocument: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
          },
          required: ['id'],
        },
        Pet: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Pet ID',
            },
            name: {
              type: 'string',
              description: 'Pet name',
            },
          },
        },
      },
    },
  }

  const mockConfigClassic: ApiReferenceConfiguration = {
    layout: 'classic',
  } as ApiReferenceConfiguration

  const mockConfigModern: ApiReferenceConfiguration = {
    layout: 'modern',
  } as ApiReferenceConfiguration

  describe('layout rendering', () => {
    it('renders ClassicLayout when config.layout is classic', () => {
      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: mockConfigClassic,
        },
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout"><slot /></div>',
              props: ['schemas'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout"><slot /></div>',
              props: ['schemas'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="classic-layout"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="modern-layout"]').exists()).toBe(false)
    })

    it('renders ModernLayout when config.layout is modern', () => {
      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: mockConfigModern,
        },
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout"><slot /></div>',
              props: ['schemas'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout"><slot /></div>',
              props: ['schemas'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="classic-layout"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="modern-layout"]').exists()).toBe(true)
    })
  })

  describe('props passing', () => {
    it('passes schemas to ClassicLayout', () => {
      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: mockConfigClassic,
        },
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout">{{ schemas ? "has schemas" : "no schemas" }}</div>',
              props: ['schemas'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout"></div>',
              props: ['schemas'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="classic-layout"]').text()).toContain('has schemas')
    })

    it('passes schemas to ModernLayout', () => {
      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: mockConfigModern,
        },
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout"></div>',
              props: ['schemas'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout">{{ schemas ? "has schemas" : "no schemas" }}</div>',
              props: ['schemas'],
            },
          },
        },
      })

      expect(wrapper.find('[data-testid="modern-layout"]').text()).toContain('has schemas')
    })
  })

  describe('edge cases', () => {
    it('renders nothing if document.components.schemas is undefined', () => {
      const wrapper = mount(Models, {
        props: {
          document: { ...mockDocument, components: {} },
          config: mockConfigClassic,
        },
        global: {
          stubs: {
            ClassicLayout: {
              template: '<div data-testid="classic-layout"></div>',
              props: ['schemas'],
            },
            ModernLayout: {
              template: '<div data-testid="modern-layout"></div>',
              props: ['schemas'],
            },
          },
        },
      })

      expect(wrapper.text()).toBe('')
    })
  })
})
