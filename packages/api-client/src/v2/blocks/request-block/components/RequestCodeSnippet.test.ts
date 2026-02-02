import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { ClientOptionGroup } from '@/v2/blocks/operation-code-sample'
import type { OperationCodeSampleProps } from '@/v2/blocks/operation-code-sample/components/OperationCodeSample.vue'

import RequestCodeSnippet from './RequestCodeSnippet.vue'

/** Minimal event bus mock - only the emit method is used by the component */
const createEventBus = () =>
  ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }) as unknown as WorkspaceEventBus

type Props = OperationCodeSampleProps & { eventBus: WorkspaceEventBus }

/** Creates props with sensible defaults, allowing overrides */
const createProps = (overrides: Partial<Props> = {}): Props => ({
  clientOptions: [] as ClientOptionGroup[],
  eventBus: createEventBus(),
  operation: { operationId: 'test' } as OperationObject,
  method: 'get',
  path: '/test',
  securitySchemes: [],
  globalCookies: [],
  integration: 'client',
  ...overrides,
})

describe('RequestCodeSnippet', () => {
  describe('visibility', () => {
    it('is visible when client options are available', () => {
      const clientOptions: ClientOptionGroup[] = [
        {
          label: 'Shell',
          options: [
            {
              id: 'shell/curl',
              lang: 'curl',
              title: 'Shell cURL',
              label: 'cURL',
              targetKey: 'shell',
              targetTitle: 'Shell',
              clientKey: 'curl',
            },
          ],
        },
      ]

      const wrapper = shallowMount(RequestCodeSnippet, {
        props: createProps({ clientOptions }),
      })

      expect(wrapper.find('collapsible-section-stub').isVisible()).toBe(true)
    })

    it('is visible when operation has x-codeSamples', () => {
      const operation = {
        operationId: 'test',
        'x-codeSamples': [
          {
            lang: 'python',
            label: 'Custom Python',
            source: 'print("hello")',
          },
        ],
      } as OperationObject

      const wrapper = shallowMount(RequestCodeSnippet, {
        props: createProps({ operation }),
      })

      expect(wrapper.find('collapsible-section-stub').isVisible()).toBe(true)
    })

    it('is visible when operation has x-custom-examples', () => {
      const operation = {
        operationId: 'test',
        'x-custom-examples': [
          {
            lang: 'javascript',
            source: 'fetch("/api")',
          },
        ],
      } as OperationObject

      const wrapper = shallowMount(RequestCodeSnippet, {
        props: createProps({ operation }),
      })

      expect(wrapper.find('collapsible-section-stub').isVisible()).toBe(true)
    })

    it('is hidden when no clients and no custom samples exist', () => {
      const wrapper = shallowMount(RequestCodeSnippet, {
        props: createProps(),
      })

      expect(wrapper.find('collapsible-section-stub').isVisible()).toBe(false)
    })
  })
})
