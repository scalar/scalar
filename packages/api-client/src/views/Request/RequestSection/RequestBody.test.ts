import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { requestExampleSchema } from '@scalar/oas-utils/entities/spec'
import { mount } from '@vue/test-utils'
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RequestBody from './RequestBody.vue'

// Mock the useWorkspace hook
vi.mock('@/store', () => ({
  useWorkspace: vi.fn(),
}))

vi.mock('@/store/active-entities', () => ({
  useActiveEntities: vi.fn(),
}))

describe('RequestBody.vue', () => {
  const props = { props: { title: 'Body' } }
  const mockActiveRequest = { value: { uid: 'mockRequestUid' } }
  const mockActiveExample = {
    value: requestExampleSchema.parse({
      uid: 'mockExampleUid',
      body: {
        activeBody: 'raw',
      },
    }),
  }

  const mockActiveEnvironment = { value: { uid: 'mockEnvironmentUid' } }
  const mockActiveEnvVariables = { value: [] }
  const mockActiveWorkspace = { value: {} }
  const mockRequestExampleMutators = {
    edit: vi.fn(),
  }

  // Mock our request + example
  beforeEach(() => {
    ;(useActiveEntities as Mock).mockReturnValue({
      activeRequest: mockActiveRequest,
      activeExample: mockActiveExample,
      activeEnvironment: mockActiveEnvironment,
      activeEnvVariables: mockActiveEnvVariables,
      activeWorkspace: mockActiveWorkspace,
    })
    ;(useWorkspace as Mock).mockReturnValue({
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
    mockActiveExample.value.body = {
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
    // @ts-expect-error TODO: figure out how vue utils handles unwrapping refs
    mockActiveExample.body = mockActiveExample.value.body = {
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
    mockActiveExample.value.body = {
      activeBody: 'binary',
    }
    const wrapper = mount(RequestBody, props)

    expect(wrapper.text()).toContain('Binary File')
    wrapper.unmount()
  })

  it('renders with json', async () => {
    mockActiveExample.value.body = {
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
    mockActiveExample.value.body = {
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
    mockActiveExample.value.body = {
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
    mockActiveExample.value.body = {
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
    mockActiveExample.value.body = {
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
})
