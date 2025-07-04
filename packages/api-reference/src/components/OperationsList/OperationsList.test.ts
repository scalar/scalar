import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { TraversedOperation, TraversedTag, TraversedWebhook } from '@/features/traverse-schema'
import OperationsList from './OperationsList.vue'

describe('OperationsList', () => {
  const createMockOperation = (overrides: Partial<TraversedOperation> = {}): TraversedOperation => ({
    id: 'test-operation-1',
    title: 'Test Operation',
    method: 'get',
    path: '/test',
    operation: {
      summary: 'Test Operation',
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
    ...overrides,
  })

  const createMockWebhook = (overrides: Partial<TraversedWebhook> = {}): TraversedWebhook => ({
    id: 'test-webhook-1',
    title: 'Test Webhook',
    method: 'post',
    name: 'test-webhook',
    webhook: {
      summary: 'Test Webhook',
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
    ...overrides,
  })

  const createMockTag = (overrides: Partial<TraversedTag> = {}): TraversedTag => ({
    id: 'test-tag',
    title: 'Test Tag',
    children: [],
    tag: {
      name: 'test',
      description: 'Test tag description',
    },
    isGroup: false,
    ...overrides,
  })

  it('renders nothing when tag has no children', () => {
    const tag = createMockTag({ children: [] })

    const wrapper = mount(OperationsList, {
      props: { tag },
      global: {
        stubs: {
          OperationsListItem: {
            template: '<div>{{ operation.title }}</div>',
            props: ['operation'],
          },
        },
      },
    })

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('shows Operations header when tag has operation children', () => {
    const operations = [
      createMockOperation({ id: 'op-1', title: 'Get Users' }),
      createMockOperation({ id: 'op-2', title: 'Create User', method: 'post' }),
    ]
    const tag = createMockTag({ children: operations })

    const wrapper = mount(OperationsList, {
      props: { tag },
      global: {
        stubs: {
          OperationsListItem: {
            template: '<div>{{ operation.title }}</div>',
            props: ['operation'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Operations')
    expect(wrapper.text()).toContain('Get Users')
    expect(wrapper.text()).toContain('Create User')
  })

  it('shows Webhooks header when tag has webhook children and isWebhooks flag', () => {
    const webhooks = [
      createMockWebhook({ id: 'webhook-1', title: 'User Created' }),
      createMockWebhook({ id: 'webhook-2', title: 'User Updated', method: 'put' }),
    ]
    const tag = createMockTag({
      children: webhooks,
      isWebhooks: true,
    })

    const wrapper = mount(OperationsList, {
      props: { tag },
      global: {
        stubs: {
          OperationsListItem: {
            template: '<div>{{ operation.title }}</div>',
            props: ['operation'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Webhooks')
    expect(wrapper.text()).toContain('User Created')
    expect(wrapper.text()).toContain('User Updated')
  })

  it('shows Operations header for mixed content when not marked as webhooks', () => {
    const operations = [createMockOperation({ id: 'op-1', title: 'Get Users' })]
    const webhooks = [createMockWebhook({ id: 'webhook-1', title: 'User Created' })]
    const tag = createMockTag({
      children: [...operations, ...webhooks],
    })

    const wrapper = mount(OperationsList, {
      props: { tag },
      global: {
        stubs: {
          OperationsListItem: {
            template: '<div>{{ operation.title }}</div>',
            props: ['operation'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Operations')
    expect(wrapper.text()).toContain('Get Users')
    expect(wrapper.text()).toContain('User Created')
  })

  it('filters out non-operation and non-webhook children', () => {
    const operations = [createMockOperation({ id: 'op-1', title: 'Get Users' })]
    const webhooks = [createMockWebhook({ id: 'webhook-1', title: 'User Created' })]
    // Add a non-operation/webhook child
    const otherChild = {
      id: 'other-1',
      title: 'Other Item',
      type: 'other',
    }
    const tag = createMockTag({
      children: [...operations, ...webhooks, otherChild as any],
    })

    const wrapper = mount(OperationsList, {
      props: { tag },
      global: {
        stubs: {
          OperationsListItem: {
            template: '<div>{{ operation.title }}</div>',
            props: ['operation'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Get Users')
    expect(wrapper.text()).toContain('User Created')
    expect(wrapper.text()).not.toContain('Other Item')
  })

  it('sets correct aria-label for the endpoints list', () => {
    const operations = [createMockOperation()]
    const tag = createMockTag({
      children: operations,
      title: 'User Management',
    })

    const wrapper = mount(OperationsList, {
      props: { tag },
      global: {
        stubs: {
          OperationsListItem: {
            template: '<div>{{ operation.title }}</div>',
            props: ['operation'],
          },
        },
      },
    })

    const ul = wrapper.find('ul')
    expect(ul.attributes('aria-label')).toBe('User Management endpoints')
  })

  it('handles tag with null children gracefully', () => {
    const tag = createMockTag({ children: null as any })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('handles tag with undefined children gracefully', () => {
    const tag = createMockTag({ children: undefined as any })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('applies correct CSS classes', () => {
    const operations = [createMockOperation()]
    const tag = createMockTag({ children: operations })

    const wrapper = mount(OperationsList, {
      props: { tag },
      global: {
        stubs: {
          OperationsListItem: {
            template: '<div>{{ operation.title }}</div>',
            props: ['operation'],
          },
        },
      },
    })

    expect(wrapper.find('.scalar-card-sticky').exists()).toBe(true)
    expect(wrapper.find('.custom-scroll').exists()).toBe(true)
    expect(wrapper.find('.endpoints').exists()).toBe(true)
  })
})
