import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { generateClientMutators } from '@scalar/workspace-store/mutators'
import { buildRequest, getExample, requestFactory } from '@scalar/workspace-store/request-example'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OperationBlock from '@/v2/blocks/operation-block/OperationBlock.vue'
import RequestParams from '@/v2/blocks/request-block/components/RequestParams.vue'

import Operation, { type OperationProps } from './Operation.vue'

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

  const getDefaultProps = (): OperationProps => {
    return {
      document: defaultDocument,
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
      plugins: [],
    }
  }

  const render = (overrides: Partial<OperationProps> = {}) => {
    const props = { ...getDefaultProps(), ...overrides } as OperationProps

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

  it.each(['schema', 'content'] as const)(
    'persists edits to a %s parameter with a downloaded example across sibling edits',
    async (kind) => {
      const externalValue = 'https://example.com/query-example.json'
      const fetch = vi.fn(async () => Response.json('downloaded'))
      const workspaceStore = createWorkspaceStore({ fetch })
      const examples = {
        default: { $ref: '#/components/examples/Query' },
        other: { value: 'other', summary: 'Unselected example' },
      }
      const parameter: ParameterObject = {
        name: 'q',
        in: 'query',
        ...(kind === 'schema'
          ? { schema: { type: 'string' }, examples }
          : { content: { 'text/plain': { schema: { type: 'string' }, examples } } }),
      }
      await workspaceStore.addDocument({
        name: 'test-document',
        document: {
          openapi: '3.2.0',
          info: { title: 'Parameter edits', version: '1' },
          components: {
            parameters: { Query: parameter },
            examples: { Query: { externalValue, summary: 'Query example', description: 'Keep this description' } },
          },
          paths: {
            '/pets': {
              parameters: [{ $ref: '#/components/parameters/Query' }],
              get: {
                parameters: [
                  {
                    name: 'filter',
                    in: 'query',
                    content: { 'application/json': { examples: { default: { value: { owner: null } } } } },
                  },
                ],
                responses: {},
              },
            },
          },
        },
      })
      const document = workspaceStore.workspace.documents['test-document']
      if (!isOpenApiDocument(document)) throw new Error('Expected an OpenAPI document')
      const sourceParameter = getResolvedRef(document.components?.parameters?.Query)!
      const savedExample = () => getExample(sourceParameter, 'default', undefined)!
      await workspaceStore.externalExamples('test-document')(savedExample()).load()
      const eventBus = createWorkspaceEventBus()
      const mutators = generateClientMutators(workspaceStore).doc('test-document').operation
      eventBus.on('operation:upsert:parameter', mutators.upsertOperationParameter)
      eventBus.on('operation:delete:parameter', mutators.deleteOperationParameter)
      const wrapper = render({ workspaceStore, document, eventBus })

      try {
        const querySection = () =>
          wrapper.findAllComponents(RequestParams).find((section) => section.props('title') === 'Query Parameters')!
        const edit = async (name: string, value: string, isDisabled = false) => {
          const section = querySection()
          const index = section.props('rows').findIndex((row) => row.name === name)
          expect(index).toBeGreaterThanOrEqual(0)
          section.vm.$emit('upsert', index, { name, value, isDisabled })
          eventBus.flushDebouncedEmits?.()
          await nextTick()
        }
        const query = () => {
          const props = wrapper.getComponent(OperationBlock).props()
          const { request } = requestFactory({
            operation: props.operation,
            method: 'get',
            path: '/pets',
            exampleName: 'default',
            environment: props.environment,
            globalCookies: [],
            proxyUrl: '',
            server: { url: 'https://example.com' },
            defaultHeaders: {},
            isElectron: false,
            selectedSecuritySchemes: [],
          })
          const result = buildRequest(request, { envVariables: {} })
          if (!result.ok) throw new Error(result.error)
          return Object.fromEntries(new URL(result.data.requestPayload[0]).searchParams)
        }

        expect(querySection().props('rows')[0]?.value).toBe('downloaded')
        expect(query()).toEqual({ q: 'downloaded', filter: '{"owner":null}' })
        expect(savedExample()).toEqual({
          externalValue,
          summary: 'Query example',
          description: 'Keep this description',
        })
        await edit('filter', '{"owner":"first"}')
        expect(query().q).toBe('downloaded')
        expect(savedExample().value).toBeUndefined()

        await edit('q', 'entered')
        await edit('filter', '{"owner":"second"}')
        expect(query()).toEqual({ q: 'entered', filter: '{"owner":"second"}' })
        expect(querySection().props('rows')[0]?.value).toBe('entered')
        expect(savedExample()).toMatchObject({
          value: 'entered',
          summary: 'Query example',
          description: 'Keep this description',
        })
        expect(getExample(sourceParameter, 'other', undefined)).toEqual({
          value: 'other',
          summary: 'Unselected example',
        })

        await edit('q', 'entered', true)
        await edit('filter', '{"owner":"third"}')
        expect(query()).toEqual({ filter: '{"owner":"third"}' })
        expect(querySection().props('rows')[0]?.isDisabled).toBe(true)
        await edit('q', 'entered-again')
        await edit('filter', '{"owner":"fourth"}')
        expect(query()).toEqual({ q: 'entered-again', filter: '{"owner":"fourth"}' })
        expect(fetch).toHaveBeenCalledTimes(1)

        querySection().vm.$emit('delete', { index: 0 })
        await nextTick()
        expect(query()).toEqual({ filter: '{"owner":"fourth"}' })
        expect(getResolvedRef(document.paths?.['/pets'])?.parameters).toEqual([])
      } finally {
        wrapper.unmount()
      }
    },
  )

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

    const defaultProps = getDefaultProps()

    defaultProps.workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName: defaultProps.documentSlug, path: '/pets', method: 'get' },
      {
        selectedIndex: 0,
        selectedSchemes: [{ apiKeyAuth: [] }],
      },
    )

    const wrapper = render({ ...defaultProps, document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props()
    expect(props.securityRequirements).toEqual([{ apiKeyAuth: [] }])
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

    const defaultProps = getDefaultProps()

    defaultProps.workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: defaultProps.documentSlug },
      {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
    )

    const wrapper = render({ ...defaultProps, document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props()
    expect(props.securityRequirements).toEqual([{ bearerAuth: [] }])
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

    const defaultProps = getDefaultProps()

    // Set auth on the auth store
    defaultProps.workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: defaultProps.documentSlug },
      {
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      },
    )

    const wrapper = render({ ...defaultProps, document })

    const oc = wrapper.getComponent({ name: 'OperationBlock' })
    const props = oc.props()
    expect(props.securityRequirements).toEqual([
      {
        bearerAuth: [],
      },
      {},
    ])
    expect(props.selectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ bearerAuth: [] }],
    })
    expect(props.authMeta).toEqual({ type: 'document' })
  })
})
