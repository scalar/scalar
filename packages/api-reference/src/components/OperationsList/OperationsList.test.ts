import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { TraversedOperation, TraversedTag, TraversedWebhook } from '@/features/traverse-schema'
import OperationsList from './OperationsList.vue'
import { createMockSidebar } from '@/helpers/test-utils'
import { useSidebar } from '@/features/sidebar'

// Mock the sidebar module
vi.mock('@/features/sidebar', () => ({
  useSidebar: vi.fn(() => createMockSidebar()),
}))

// Mock Scalar components
vi.mock('@scalar/components', () => ({
  ScalarCard: {
    name: 'ScalarCard',
    template: '<div class="scalar-card"><slot /></div>',
  },
  ScalarCardHeader: {
    name: 'ScalarCardHeader',
    template: '<div class="scalar-card-header"><slot /></div>',
    props: ['muted'],
  },
  ScalarCardSection: {
    name: 'ScalarCardSection',
    template: '<div class="scalar-card-section"><slot /></div>',
    props: ['class'],
  },
}))

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
    })

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('shows Operations header when tag has operation children', () => {
    const operations = [
      createMockOperation({ id: 'op-1', title: 'Get Users', path: '/users' }),
      createMockOperation({ id: 'op-2', title: 'Create User', method: 'post', path: '/users' }),
    ]
    const tag = createMockTag({ children: operations })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    expect(wrapper.text()).toContain('Operations')
    expect(wrapper.text()).toContain('/users')
    expect(wrapper.text()).toContain('get')
    expect(wrapper.text()).toContain('post')
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
    })

    expect(wrapper.text()).toContain('Webhooks')
    expect(wrapper.text()).toContain('User Created')
    expect(wrapper.text()).toContain('User Updated')
  })

  it('shows Operations header for mixed content when not marked as webhooks', () => {
    const operations = [createMockOperation({ id: 'op-1', title: 'Get Users', path: '/users' })]
    const webhooks = [createMockWebhook({ id: 'webhook-1', title: 'User Created' })]
    const tag = createMockTag({
      children: [...operations, ...webhooks],
    })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    expect(wrapper.text()).toContain('Operations')
    expect(wrapper.text()).toContain('/users')
    expect(wrapper.text()).toContain('User Created')
  })

  it('filters out non-operation and non-webhook children', () => {
    const operations = [createMockOperation({ id: 'op-1', title: 'Get Users', path: '/users' })]
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
    })

    expect(wrapper.text()).toContain('/users')
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

  it('applies correct CSS classes', async () => {
    vi.mocked(useSidebar).mockReturnValue(createMockSidebar({ 'test-tag': true }))

    const operations = [createMockOperation()]
    const tag = createMockTag({ children: operations })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    // The custom-scroll class is applied to the ScalarCardSection component
    const scalarCardSection = wrapper.findComponent({ name: 'ScalarCardSection' })
    expect(scalarCardSection.exists()).toBe(true)
    expect(scalarCardSection.props('class')).toBe('custom-scroll max-h-[60vh]')

    expect(wrapper.find('.endpoints').exists()).toBe(true)
  })

  it('renders OperationsListItem components for each operation', () => {
    const operations = [
      createMockOperation({ id: 'op-1', title: 'Get Users', path: '/users' }),
      createMockOperation({ id: 'op-2', title: 'Create User', path: '/users' }),
    ]
    const tag = createMockTag({ children: operations })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    const operationsListItems = wrapper.findAllComponents({ name: 'OperationsListItem' })
    expect(operationsListItems).toHaveLength(2)

    expect(operationsListItems[0].props('operation')).toEqual(operations[0])
    expect(operationsListItems[1].props('operation')).toEqual(operations[1])
  })

  it('renders OperationsListItem components for webhooks', () => {
    const webhooks = [createMockWebhook({ id: 'webhook-1', title: 'User Created' })]
    const tag = createMockTag({
      children: webhooks,
      isWebhooks: true,
    })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    const operationsListItems = wrapper.findAllComponents({ name: 'OperationsListItem' })
    expect(operationsListItems).toHaveLength(1)
    expect(operationsListItems[0].props('operation')).toEqual(webhooks[0])
  })

  it('renders ScreenReader component with tag title', () => {
    const operations = [createMockOperation()]
    const tag = createMockTag({
      children: operations,
      title: 'User Management',
    })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    const screenReader = wrapper.findComponent({ name: 'ScreenReader' })
    expect(screenReader.exists()).toBe(true)
    expect(screenReader.text()).toBe('User Management')
  })

  it('renders operations with correct paths and methods', () => {
    const operations = [
      createMockOperation({ id: 'op-1', title: 'Get Users', path: '/api/users', method: 'get' }),
      createMockOperation({ id: 'op-2', title: 'Create User', path: '/api/users', method: 'post' }),
    ]
    const tag = createMockTag({ children: operations })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    // Check that the operations are rendered with their paths
    expect(wrapper.text()).toContain('/api/users')
    expect(wrapper.text()).toContain('get')
    expect(wrapper.text()).toContain('post')
  })

  it('renders webhooks with correct titles and methods', () => {
    const webhooks = [
      createMockWebhook({ id: 'webhook-1', title: 'User Created', method: 'post' }),
      createMockWebhook({ id: 'webhook-2', title: 'User Updated', method: 'put' }),
    ]
    const tag = createMockTag({
      children: webhooks,
      isWebhooks: true,
    })

    const wrapper = mount(OperationsList, {
      props: { tag },
    })

    // Check that the webhooks are rendered with their titles
    expect(wrapper.text()).toContain('User Created')
    expect(wrapper.text()).toContain('User Updated')
    expect(wrapper.text()).toContain('post')
    expect(wrapper.text()).toContain('put')
  })
})
