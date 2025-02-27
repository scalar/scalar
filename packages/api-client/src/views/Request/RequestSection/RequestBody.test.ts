import { useWorkspace } from '@/store'
import { operationSchema, requestExampleSchema } from '@scalar/oas-utils/entities/spec'
import { createStoreEvents } from '@/store/events'
import { mount } from '@vue/test-utils'
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RequestBody from './RequestBody.vue'
import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'

// Mock the useWorkspace hook
vi.mock('@/store', () => ({
  useWorkspace: vi.fn(),
}))

vi.mock('@/store/active-entities', () => ({
  useActiveEntities: vi.fn(),
}))

describe('RequestBody.vue', () => {
  const mockOperation = operationSchema.parse({ uid: 'mockRequestUid' })
  const mockActiveExample = requestExampleSchema.parse({
    uid: 'mockExampleUid',
    body: {
      activeBody: 'raw',
    },
  })
  const mockActiveEnvironment = environmentSchema.parse({
    uid: 'mockEnvironmentUid',
  })
  const mockActiveWorkspace = workspaceSchema.parse({
    uid: 'mockWorkspaceUid',
  })
  const mockRequestExampleMutators = {
    edit: vi.fn(),
  }
  const props = {
    props: {
      title: 'Body',
      example: mockActiveExample,
      operation: mockOperation,
      environment: mockActiveEnvironment,
      envVariables: [],
      workspace: mockActiveWorkspace,
    },
    global: {
      stubs: {
        RouterLink: true,
      },
    },
  }

  // Mock our request + example
  beforeEach(() => {
    ;(useWorkspace as Mock).mockReturnValue({
      events: createStoreEvents(),
      requestExampleMutators: mockRequestExampleMutators,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with no body', async () => {
    const wrapper = mount(RequestBody, props)
    expect(wrapper.text()).toContain('No Body')
    wrapper.unmount()
  })

  it('renders with multipart form', async () => {
    mockActiveExample.body = {
      activeBody: 'formData',
      formData: {
        encoding: 'form-data',
        value: [],
      },
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('Multipart Form')
    wrapper.unmount()
  })

  it('renders with url encoded form', async () => {
    mockActiveExample.body = mockActiveExample.body = {
      activeBody: 'formData',
      formData: {
        encoding: 'urlencoded',
        value: [],
      },
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('Form URL Encoded')
    wrapper.unmount()
  })

  it('renders with binary file', async () => {
    mockActiveExample.body = {
      activeBody: 'binary',
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('Binary File')
    wrapper.unmount()
  })

  it('renders with json', async () => {
    mockActiveExample.body = {
      activeBody: 'raw',
      raw: {
        encoding: 'json',
        value: '',
      },
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('JSON')
    wrapper.unmount()
  })

  it('renders with xml', async () => {
    mockActiveExample.body = {
      activeBody: 'raw',
      raw: {
        encoding: 'xml',
        value: '',
      },
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('XML')
    wrapper.unmount()
  })

  it('renders with yaml', async () => {
    mockActiveExample.body = {
      activeBody: 'raw',
      raw: {
        encoding: 'yaml',
        value: '',
      },
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('YAML')
    wrapper.unmount()
  })

  it('renders with edn', async () => {
    mockActiveExample.body = {
      activeBody: 'raw',
      raw: {
        encoding: 'edn',
        value: '',
      },
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('EDN')
    wrapper.unmount()
  })

  it('renders with other', async () => {
    mockActiveExample.body = {
      activeBody: 'raw',
      raw: {
        encoding: 'html',
        value: '',
      },
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('Other')
    wrapper.unmount()
  })

  it('keeps Content-Type header when switching to raw body type', async () => {
    mockActiveExample.body = {
      activeBody: 'formData',
      formData: {
        encoding: 'form-data',
        value: [],
      },
    }

    mockActiveExample.parameters = {
      headers: [{ key: 'Content-Type', value: 'multipart/form-data', enabled: true }],
      path: [],
      cookies: [],
      query: [],
    }

    const wrapper = mount(RequestBody, props)

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    await listbox.vm.$emit('update:modelValue', { id: 'json', label: 'JSON' })

    expect(mockRequestExampleMutators.edit).toHaveBeenCalledWith('mockExampleUid', 'parameters.headers', [
      { key: 'Content-Type', value: 'application/json', enabled: true },
    ])

    wrapper.unmount()
  })
})
