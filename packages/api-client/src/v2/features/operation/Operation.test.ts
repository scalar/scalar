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
    securitySchemes: {},
    activeWorkspace: {
      id: 'test-workspace',
      label: 'Test Workspace',
    },
    plugins: [],
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
      'x-scalar-set-operation-security': true,
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            security: [{ apiKeyAuth: [] }],
            responses: {},
          },
        },
      },
    }

    defaultProps.workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName: defaultProps.documentSlug, path: '/pets', method: 'get' },
      {
        selectedIndex: 0,
        selectedSchemes: [{ apiKeyAuth: [] }],
      },
    )

    const wrapper = render({ document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props() as any
    expect(props.documentSecurity).toEqual([{ bearerAuth: [] }])
    expect(props.operationSelectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ apiKeyAuth: [] }],
    })
    expect(props.setOperationSecurity).toBe(true)
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

    defaultProps.workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: defaultProps.documentSlug },
      {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
    )

    const wrapper = render({ document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props()
    expect(props.documentSecurity).toEqual([{ bearerAuth: [] }])
    expect(props.documentSelectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ bearerAuth: [] }],
    })
    expect(props.authMeta).toEqual({ type: 'document' })
  })

  it('merges document security when operation security is an empty object entry', () => {
    const document = {
      ...defaultDocument,
      security: [{ bearerAuth: [] }],
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

    // Set auth on the auth store
    defaultProps.workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: defaultProps.documentSlug },
      {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
    )

    const wrapper = render({ document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props() as any
    expect(props.documentSecurity).toEqual([{ bearerAuth: [] }])
    expect(props.documentSelectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ bearerAuth: [] }],
    })
    expect(props.authMeta).toEqual({ type: 'document' })
  })
})
