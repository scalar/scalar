import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import type {
  OpenApiDocument,
  ParameterObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { ClientLayout } from '@/hooks'
import type { EnvVariable } from '@/store'
import { createStoreEvents } from '@/store/events'
import type { History } from '@/v2/blocks/scalar-address-bar-block'

import Operation from './Operation.vue'

/** Helper to create a minimal operation object */
function createMockOperation(overrides: Partial<OperationObject> = {}): OperationObject {
  return {
    uid: 'op-1',
    summary: 'Test operation',
    description: 'Test description',
    method: 'get',
    path: '/test',
    parameters: [],
    responses: {},
    ...overrides,
  } as OperationObject
}

/** Helper to create default props for the Operation component */
function createDefaultProps(
  overrides: Partial<{
    appVersion: string
    path: string
    method: HttpMethod
    layout: ClientLayout
    server: ServerObject | undefined
    servers: ServerObject[]
    history: History[]
    requestLoadingPercentage: number
    response: ResponseInstance
    request: Request
    totalPerformedRequests: number
    showSidebar: boolean
    hideClientButton: boolean
    integration: string | null
    documentUrl: string
    source: 'gitbook' | 'api-reference'
    operation: OperationObject
    exampleKey: string
    selectedContentType: string
    securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
    selectedSecurity: OpenApiDocument['x-scalar-selected-security']
    security: OpenApiDocument['security']
    events: ReturnType<typeof createStoreEvents>
    environment: Environment
    envVariables: EnvVariable[]
  }> = {},
) {
  const mockEvents = createStoreEvents()

  return {
    appVersion: '1.0.0',
    path: '/api/users',
    method: 'get' as const,
    layout: 'web' as const,
    server: undefined,
    servers: [],
    history: [],
    requestLoadingPercentage: undefined,
    response: undefined,
    request: undefined,
    totalPerformedRequests: 0,
    showSidebar: true,
    hideClientButton: false,
    integration: null,
    documentUrl: '',
    source: 'api-reference' as const,
    operation: createMockOperation(),
    exampleKey: 'default',
    selectedContentType: 'application/json',
    securitySchemes: undefined,
    selectedSecurity: undefined,
    security: undefined,
    events: mockEvents,
    environment: {
      uid: 'env-1' as any,
      name: 'Test Environment',
      color: 'blue',
      value: '',
      isDefault: true,
    } satisfies Environment,
    envVariables: [],
    ...overrides,
  }
}

describe('Operation Component', () => {
  describe('rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('renders all child components', () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      const operationBlock = wrapper.findComponent({ name: 'OperationBlock' })
      const responseBlock = wrapper.findComponent({ name: 'ResponseBlock' })
      const viewLayout = wrapper.findComponent({ name: 'ViewLayout' })

      expect(header.exists()).toBe(true)
      expect(operationBlock.exists()).toBe(true)
      expect(responseBlock.exists()).toBe(true)
      expect(viewLayout.exists()).toBe(true)
    })
  })

  describe('Header event forwarding', () => {
    it('forwards addressBar:importCurl event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      await header.vm.$emit('importCurl', 'curl -X GET https://example.com')

      expect(wrapper.emitted('addressBar:importCurl')).toBeTruthy()
      expect(wrapper.emitted('addressBar:importCurl')?.[0]).toEqual(['curl -X GET https://example.com'])
    })

    it('forwards addressBar:update:method event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      const payload = { method: 'POST' as HttpMethod }
      await header.vm.$emit('update:method', payload)

      expect(wrapper.emitted('addressBar:update:method')).toBeTruthy()
      expect(wrapper.emitted('addressBar:update:method')?.[0]).toEqual([payload])
    })

    it('forwards addressBar:update:path event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      const payload = { path: '/api/new-path' }
      await header.vm.$emit('update:path', payload)

      expect(wrapper.emitted('addressBar:update:path')).toBeTruthy()
      expect(wrapper.emitted('addressBar:update:path')?.[0]).toEqual([payload])
    })

    it('forwards addressBar:execute event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      await header.vm.$emit('execute')

      expect(wrapper.emitted('addressBar:execute')).toBeTruthy()
      expect(wrapper.emitted('addressBar:execute')?.length).toBe(1)
    })

    it('forwards addressBar:update:selectedServer event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      const payload = { id: 'server-123' }
      await header.vm.$emit('update:selectedServer', payload)

      expect(wrapper.emitted('addressBar:update:selectedServer')).toBeTruthy()
      expect(wrapper.emitted('addressBar:update:selectedServer')?.[0]).toEqual([payload])
    })

    it('forwards addressBar:update:variable event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      const payload = { key: 'API_KEY', value: 'secret-key' }
      await header.vm.$emit('update:variable', payload)

      expect(wrapper.emitted('addressBar:update:variable')).toBeTruthy()
      expect(wrapper.emitted('addressBar:update:variable')?.[0]).toEqual([payload])
    })

    it('forwards addressBar:add:server event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      await header.vm.$emit('add:server')

      expect(wrapper.emitted('addressBar:add:server')).toBeTruthy()
      expect(wrapper.emitted('addressBar:add:server')?.length).toBe(1)
    })

    it('forwards addressBar:hideModal event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const header = wrapper.findComponent({ name: 'Header' })
      await header.vm.$emit('addressBar:hideModal')

      expect(wrapper.emitted('addressBar:hideModal')).toBeTruthy()
      expect(wrapper.emitted('addressBar:hideModal')?.length).toBe(1)
    })
  })

  describe('OperationBlock event forwarding', () => {
    it('forwards operation:update:requestName event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const operationBlock = wrapper.findComponent({ name: 'OperationBlock' })
      const payload = { name: 'New Request Name' }
      await operationBlock.vm.$emit('operation:update:requestName', payload)

      expect(wrapper.emitted('operation:update:requestName')).toBeTruthy()
      expect(wrapper.emitted('operation:update:requestName')?.[0]).toEqual([payload])
    })

    describe('auth events', () => {
      it('forwards auth:delete event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const names = ['scheme1', 'scheme2']
        await operationBlock.vm.$emit('auth:delete', names)

        expect(wrapper.emitted('auth:delete')).toBeTruthy()
        expect(wrapper.emitted('auth:delete')?.[0]).toEqual([names])
      })

      it('forwards auth:update:securityScheme event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = {
          name: 'apiKey',
          scheme: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
        }
        await operationBlock.vm.$emit('auth:update:securityScheme', payload)

        expect(wrapper.emitted('auth:update:securityScheme')).toBeTruthy()
        expect(wrapper.emitted('auth:update:securityScheme')?.[0]).toEqual([payload])
      })

      it('forwards auth:update:selectedScopes event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = {
          id: ['scope1', 'scope2'],
          name: 'oauth2',
          scopes: ['read', 'write'],
        }
        await operationBlock.vm.$emit('auth:update:selectedScopes', payload)

        expect(wrapper.emitted('auth:update:selectedScopes')).toBeTruthy()
        expect(wrapper.emitted('auth:update:selectedScopes')?.[0]).toEqual([payload])
      })

      it('forwards auth:update:selectedSecurity event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = {
          value: [{ apiKey: [] }],
          create: [{ type: 'apiKey', name: 'X-API-Key', in: 'header' }] as SecuritySchemeObject[],
        }
        await operationBlock.vm.$emit('auth:update:selectedSecurity', payload)

        expect(wrapper.emitted('auth:update:selectedSecurity')).toBeTruthy()
        expect(wrapper.emitted('auth:update:selectedSecurity')?.[0]).toEqual([payload])
      })
    })

    describe('parameter events', () => {
      it('forwards parameters:add event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = {
          type: 'query' as ParameterObject['in'],
          payload: { key: 'page', value: '1' },
        }
        await operationBlock.vm.$emit('parameters:add', payload)

        expect(wrapper.emitted('parameters:add')).toBeTruthy()
        expect(wrapper.emitted('parameters:add')?.[0]).toEqual([payload])
      })

      it('forwards parameters:update event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = {
          index: 0,
          type: 'query' as ParameterObject['in'],
          payload: { key: 'limit', value: '10', isEnabled: true },
        }
        await operationBlock.vm.$emit('parameters:update', payload)

        expect(wrapper.emitted('parameters:update')).toBeTruthy()
        expect(wrapper.emitted('parameters:update')?.[0]).toEqual([payload])
      })

      it('forwards parameters:delete event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = { type: 'header' as ParameterObject['in'], index: 0 }
        await operationBlock.vm.$emit('parameters:delete', payload)

        expect(wrapper.emitted('parameters:delete')).toBeTruthy()
        expect(wrapper.emitted('parameters:delete')?.[0]).toEqual([payload])
      })

      it('forwards parameters:deleteAll event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = { type: 'query' as ParameterObject['in'] }
        await operationBlock.vm.$emit('parameters:deleteAll', payload)

        expect(wrapper.emitted('parameters:deleteAll')).toBeTruthy()
        expect(wrapper.emitted('parameters:deleteAll')?.[0]).toEqual([payload])
      })
    })

    describe('request body events', () => {
      it('forwards requestBody:update:contentType event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = { value: 'application/xml' }
        await operationBlock.vm.$emit('requestBody:update:contentType', payload)

        expect(wrapper.emitted('requestBody:update:contentType')).toBeTruthy()
        expect(wrapper.emitted('requestBody:update:contentType')?.[0]).toEqual([payload])
      })

      it('forwards requestBody:update:value event with string value', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = { value: '{"key": "value"}' }
        await operationBlock.vm.$emit('requestBody:update:value', payload)

        expect(wrapper.emitted('requestBody:update:value')).toBeTruthy()
        expect(wrapper.emitted('requestBody:update:value')?.[0]).toEqual([payload])
      })

      it('forwards requestBody:add:formRow event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = { key: 'field1', value: 'value1' }
        await operationBlock.vm.$emit('requestBody:add:formRow', payload)

        expect(wrapper.emitted('requestBody:add:formRow')).toBeTruthy()
        expect(wrapper.emitted('requestBody:add:formRow')?.[0]).toEqual([payload])
      })

      it('forwards requestBody:update:formRow event', async () => {
        const wrapper = mount(Operation, {
          props: createDefaultProps(),
        })

        const operationBlock = wrapper.findComponent({
          name: 'OperationBlock',
        })
        const payload = { index: 0, payload: { key: 'field2', value: 'value2' } }
        await operationBlock.vm.$emit('requestBody:update:formRow', payload)

        expect(wrapper.emitted('requestBody:update:formRow')).toBeTruthy()
        expect(wrapper.emitted('requestBody:update:formRow')?.[0]).toEqual([payload])
      })
    })
  })

  describe('ResponseBlock event forwarding', () => {
    it('forwards response:addRequest event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const responseBlock = wrapper.findComponent({ name: 'ResponseBlock' })
      await responseBlock.vm.$emit('addRequest')

      expect(wrapper.emitted('response:addRequest')).toBeTruthy()
      expect(wrapper.emitted('response:addRequest')?.length).toBe(1)
    })

    it('forwards response:sendRequest event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const responseBlock = wrapper.findComponent({ name: 'ResponseBlock' })
      await responseBlock.vm.$emit('sendRequest')

      expect(wrapper.emitted('response:sendRequest')).toBeTruthy()
      expect(wrapper.emitted('response:sendRequest')?.length).toBe(1)
    })

    it('forwards response:openCommandPalette event', async () => {
      const wrapper = mount(Operation, {
        props: createDefaultProps(),
      })

      const responseBlock = wrapper.findComponent({ name: 'ResponseBlock' })
      await responseBlock.vm.$emit('openCommandPalette')

      expect(wrapper.emitted('response:openCommandPalette')).toBeTruthy()
      expect(wrapper.emitted('response:openCommandPalette')?.length).toBe(1)
    })
  })
})
