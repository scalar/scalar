import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { RouteProps } from '../app/helpers/routes'
import Operation from './Operation.vue'

describe('Operation', () => {
  const eventBus = createWorkspaceEventBus()

  const defaultDocument = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    components: { securitySchemes: {} },
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          responses: {},
        },
      },
    },
    'x-scalar-original-document-hash': '123',
  }

  const defaultProps: RouteProps = {
    document: defaultDocument as any,
    layout: 'web',
    eventBus,
    path: '/pets',
    method: 'get',
    exampleName: 'default',
    environment: {
      color: 'blue',
      variables: [],
      description: 'Test Environment',
    },
    workspaceStore: createWorkspaceStore(),
  }

  const render = (overrides: Partial<RouteProps> = {}) => {
    const props = { ...defaultProps, ...overrides } as RouteProps
    return mount(Operation, {
      props,
      global: {
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<a><slot /></a>',
          },
        },
      },
    })
  }

  it('renders fallback message when required props are missing', () => {
    const wrapper = render({ document: null as any })

    expect(wrapper.text()).toContain('Select an operation to view details')
  })

  it('renders OperationBlock when path, method, exampleName and operation exist', () => {
    const document = {
      ...defaultDocument,
      components: { securitySchemes: {} },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            responses: {},
          },
        },
      },
    }

    const wrapper = render({ document })

    const oc = wrapper.findComponent({ name: 'OperationBlock' })
    expect(oc.exists()).toBe(true)
  })

  it('passes operation security to OperationBlock when defined on operation', () => {
    const document = {
      ...defaultDocument,
      components: { securitySchemes: {} },
      security: [{ bearerAuth: [] }],
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
      paths: {
        '/pets': {
          get: {
            security: [{ apiKeyAuth: [] }],
            'x-scalar-selected-security': {
              selectedIndex: 0,
              selectedSchemes: [{ apiKeyAuth: [] }],
            },
            responses: {},
          },
        },
      },
    }

    const wrapper = render({ document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props() as any
    expect(props.security).toEqual([{ apiKeyAuth: [] }])
    expect(props.selectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ apiKeyAuth: [] }],
    })
    expect(props.authMeta).toEqual({ type: 'operation', path: '/pets', method: 'get' })
  })

  it('uses document security when operation security is not defined', () => {
    const document = {
      ...defaultDocument,
      components: { securitySchemes: {} },
      security: [{ bearerAuth: [] }],
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
      paths: {
        '/pets': {
          get: {
            responses: {},
          },
        },
      },
    }

    const wrapper = render({ document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props()
    expect(props.security).toEqual([{ bearerAuth: [] }])
    expect(props.selectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ bearerAuth: [] }],
    })
    expect(props.authMeta).toEqual({ type: 'document' })
  })

  it('merges document security when operation security is an empty object entry', () => {
    const document = {
      ...defaultDocument,
      components: { securitySchemes: {} },
      security: [{ bearerAuth: [] }],
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
      paths: {
        '/pets': {
          get: {
            security: [{}],
            responses: {},
          },
        },
      },
    }

    const wrapper = render({ document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props() as any
    expect(props.security).toEqual([{ bearerAuth: [] }, {}])
    expect(props.selectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ bearerAuth: [] }],
    })
    expect(props.authMeta).toEqual({ type: 'document' })
  })
})
