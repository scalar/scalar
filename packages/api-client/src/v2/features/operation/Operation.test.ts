import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { RouteProps } from '../app/helpers/routes'
import Operation from './Operation.vue'

describe('Operation', () => {
  const eventBus = createWorkspaceEventBus()

  const defaultNavigation = {
    type: 'document' as const,
    id: 'default',
    name: 'default',
    title: 'Test API',
    children: [
      {
        id: 'default/get/pets',
        method: 'get' as const,
        path: '/pets',
        isDeprecated: false,
        ref: '#/paths/~1pets/get',
        title: 'listPets',
        type: 'operation' as const,
        children: [],
      },
    ],
  }

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
    'x-scalar-navigation': defaultNavigation,
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
    documentSlug: 'test-document',
    activeWorkspace: {
      id: 'test-workspace',
      name: 'Test Workspace',
    },
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
    const wrapper = render()

    const oc = wrapper.findComponent({ name: 'OperationBlock' })
    expect(oc.exists()).toBe(true)
  })

  it('passes operation security to OperationBlock when defined on operation', () => {
    const document = {
      ...defaultDocument,
      security: [{ bearerAuth: [] }],
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
      'x-scalar-set-operation-security': true,
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
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
      security: [{ bearerAuth: [] }],
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
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
      security: [{ bearerAuth: [] }],
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
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
