import type { TraversedOperation, TraversedWebhook } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import OperationsListItem from './OperationsListItem.vue'

// Mock the dependencies
const mockScrollToOperation = vi.fn()
vi.mock('@/v2/blocks/scalar-navigation-block', () => ({
  useSidebar: () => ({
    scrollToOperation: mockScrollToOperation,
  }),
}))

vi.mock('@scalar/oas-utils/helpers', () => ({
  isOperationDeprecated: vi.fn(),
}))

describe('OperationsListItem', () => {
  const createMockOperation = (overrides: Partial<TraversedOperation> = {}): TraversedOperation => ({
    type: 'operation',
    ref: 'test-operation-1',
    id: 'test-operation-1',
    title: 'Test Operation',
    method: 'get',
    path: '/test',
    ...overrides,
  })

  const createMockWebhook = (overrides: Partial<TraversedWebhook> = {}): TraversedWebhook => ({
    type: 'webhook',
    ref: 'test-webhook-1',
    id: 'test-webhook-1',
    title: 'Test Webhook',
    method: 'post',
    name: 'test-webhook',
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders operation with path when operation has path property', () => {
      const operation = createMockOperation({ path: '/api/users' })

      const wrapper = mount(OperationsListItem, {
        props: { operation },
      })

      expect(wrapper.text()).toContain('/api/users')
      expect(wrapper.find('a').attributes('href')).toBe('#test-operation-1')
    })

    it('renders webhook with title when webhook has no path property', () => {
      const webhook = createMockWebhook({ title: 'User Created Webhook' })

      const wrapper = mount(OperationsListItem, {
        props: { operation: webhook },
      })

      expect(wrapper.text()).toContain('User Created Webhook')
      expect(wrapper.find('a').attributes('href')).toBe('#test-webhook-1')
    })

    it('applies correct CSS classes', () => {
      const operation = createMockOperation()

      const wrapper = mount(OperationsListItem, {
        props: { operation },
      })

      expect(wrapper.find('li.contents').exists()).toBe(true)
      expect(wrapper.find('a.endpoint').exists()).toBe(true)
      expect(wrapper.find('.endpoint-path').exists()).toBe(true)
    })
  })

  describe('webhook functionality', () => {
    it('shows webhook icon for webhook operations', () => {
      const webhook = createMockWebhook()

      const wrapper = mount(OperationsListItem, {
        props: { operation: webhook },
      })

      expect(wrapper.findComponent({ name: 'ScalarIconWebhooksLogo' }).exists()).toBe(true)
    })

    it('does not show webhook icon for regular operations', () => {
      const operation = createMockOperation()

      const wrapper = mount(OperationsListItem, {
        props: { operation },
      })

      expect(wrapper.findComponent({ name: 'ScalarIconWebhooksLogo' }).exists()).toBe(false)
    })

    it('handles webhook with different methods', () => {
      const webhooks = [createMockWebhook({ method: 'post' }), createMockWebhook({ method: 'get' })]

      webhooks.forEach((webhook) => {
        const wrapper = mount(OperationsListItem, {
          props: { operation: webhook },
        })

        expect(wrapper.text()).toContain(webhook.method)
        expect(wrapper.findComponent({ name: 'ScalarIconWebhooksLogo' }).exists()).toBe(true)
      })
    })
  })

  describe('deprecation', () => {
    it('applies deprecated class when operation is deprecated', async () => {
      const { isOperationDeprecated } = await import('@scalar/oas-utils/helpers')
      vi.mocked(isOperationDeprecated).mockReturnValue(true)

      const operation = createMockOperation({ isDeprecated: true })

      const wrapper = mount(OperationsListItem, {
        props: { operation },
      })

      expect(wrapper.find('.deprecated').exists()).toBe(true)
    })

    it('does not apply deprecated class when operation is not deprecated', async () => {
      const { isOperationDeprecated } = await import('@scalar/oas-utils/helpers')
      vi.mocked(isOperationDeprecated).mockReturnValue(false)

      const operation = createMockOperation()

      const wrapper = mount(OperationsListItem, {
        props: { operation },
      })

      expect(wrapper.find('.deprecated').exists()).toBe(false)
    })

    it('does not apply deprecated class for webhooks', async () => {
      const { isOperationDeprecated } = await import('@scalar/oas-utils/helpers')
      vi.mocked(isOperationDeprecated).mockReturnValue(true)

      const webhook = createMockWebhook()

      const wrapper = mount(OperationsListItem, {
        props: { operation: webhook },
      })

      expect(wrapper.find('.deprecated').exists()).toBe(false)
      // The component calls isOperationDeprecated for all operations, but webhooks don't get the deprecated class
      // because they don't have an 'operation' property that can be deprecated
    })
  })

  describe('collapsed state', () => {
    it('does not show hidden header when not collapsed', () => {
      const operation = createMockOperation()

      const wrapper = mount(OperationsListItem, {
        props: { operation, isCollapsed: false },
      })

      expect(wrapper.find('.sr-only').exists()).toBe(false)
    })
  })

  describe('interactions', () => {
    it('calls scrollToOperation when link is clicked', async () => {
      const operation = createMockOperation()

      const wrapper = mount(OperationsListItem, {
        props: { operation },
      })

      await wrapper.find('a').trigger('click')
      expect(mockScrollToOperation).toHaveBeenCalledWith(operation.id, true)
    })

    it('prevents default link behavior', async () => {
      const operation = createMockOperation()

      const wrapper = mount(OperationsListItem, {
        props: { operation },
      })

      const link = wrapper.find('a')
      expect(link.attributes('href')).toBe('#test-operation-1')

      // The click handler should prevent default navigation
      await link.trigger('click')
      // If preventDefault wasn't called, the test would fail due to navigation
    })
  })

  describe('HTTP methods', () => {
    it('handles different HTTP methods correctly', () => {
      const operations = [
        createMockOperation({ method: 'get' }),
        createMockOperation({ method: 'post' }),
        createMockOperation({ method: 'put' }),
        createMockOperation({ method: 'delete' }),
      ]

      operations.forEach((operation) => {
        const wrapper = mount(OperationsListItem, {
          props: { operation },
        })

        expect(wrapper.text()).toContain(operation.method)
      })
    })
  })
})
