import { type ApiReferenceConfiguration, apiReferenceConfigurationSchema } from '@scalar/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import OperationsSection from './OperationsSection.vue'

const mockScrollToOperation = vi.fn()
vi.mock('@/features/sidebar', () => ({
  useSidebar: () => ({
    scrollToOperation: mockScrollToOperation,
  }),
}))

vi.mock('@scalar/api-client/store', () => ({
  useWorkspace: () => ({
    collections: {
      'default': {
        uid: 'default',
        servers: ['server1'],
        selectedServerUid: 'server1',
      },
    },
    servers: {
      'server1': {
        uid: 'server1',
        url: 'https://api.example.com',
      },
    },
  }),
  useActiveEntities: () => ({
    activeCollection: { value: { uid: 'default', servers: ['server1'], selectedServerUid: 'server1' } },
  }),
}))

function createConfiguration(config: Partial<ApiReferenceConfiguration> = {}): ApiReferenceConfiguration {
  return apiReferenceConfigurationSchema.parse(config)
}

describe('OperationsSection', () => {
  it('renders a single operation summary when document has one operation and no tag', () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      paths: {
        '/hello': {
          get: {
            summary: 'Say Hello',
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    } as const

    const wrapper = mount(OperationsSection, {
      props: {
        document,
        config: createConfiguration({
          tagsSorter: 'alpha',
        }),
      },
    })

    expect(wrapper.text()).toContain('Say Hello')
  })
})
