import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { xScalarEnvironmentSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { mockEventBus } from '@/v2/helpers/test-utils'

import Cookies from './Cookies.vue'

describe('Cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseEnvironment = coerceValue(xScalarEnvironmentSchema, {
    color: '#FFFFFF',
    variables: [],
  })

  const createWorkspaceStoreInstance = () => {
    const store = createWorkspaceStore()
    return store
  }

  const createDocumentProps = (overrides: Partial<CollectionProps> = {}) => {
    const document = coerceValue(OpenAPIDocumentSchema, {
      info: {
        title: 'Test API',
        description: 'Test description',
      },
    })

    return {
      documentSlug: 'test-document',
      document,
      eventBus: mockEventBus,
      layout: 'desktop',
      environment: baseEnvironment,
      workspaceStore: createWorkspaceStoreInstance(),
      activeWorkspace: {
        id: 'test-workspace',
        name: 'Test Workspace',
      },
      collectionType: 'document' as const,
      ...overrides,
    } as CollectionProps & { collectionType: 'document' }
  }

  const createWorkspaceProps = (overrides: Partial<CollectionProps> = {}) => {
    return {
      documentSlug: '',
      document: null,
      eventBus: mockEventBus,
      layout: 'desktop',
      environment: baseEnvironment,
      workspaceStore: createWorkspaceStoreInstance(),
      activeWorkspace: {
        id: 'test-workspace',
        name: 'Test Workspace',
      },
      collectionType: 'workspace' as const,
      ...overrides,
    } as CollectionProps & { collectionType: 'workspace' }
  }

  describe('rendering', () => {
    it('renders the Cookies heading', () => {
      const props = createDocumentProps()
      const wrapper = mount(Cookies, { props })

      const heading = wrapper.find('h3')
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('Cookies')
    })

    it('renders the description text', () => {
      const props = createDocumentProps()
      const wrapper = mount(Cookies, { props })

      const description = wrapper.find('p')
      expect(description.exists()).toBe(true)
      expect(description.text()).toContain("Manage your collection's cookies here")
      expect(description.text()).toContain('Cookies allow you to store')
    })

    it('renders CookiesTable component', () => {
      const props = createDocumentProps()
      const wrapper = mount(Cookies, { props })

      const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
      expect(cookiesTable.exists()).toBe(true)
    })
  })

  describe('cookies computation', () => {
    it('uses document cookies when collectionType is document', () => {
      const documentCookies = [
        { name: 'sessionId', value: 'abc123', domain: 'example.com' },
        { name: 'authToken', value: 'token456', domain: 'example.com' },
      ]

      const document = coerceValue(OpenAPIDocumentSchema, {
        info: {
          title: 'Test API',
        },
        'x-scalar-cookies': documentCookies,
      })

      const props = createDocumentProps({ document })
      const wrapper = mount(Cookies, { props })

      const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
      expect(cookiesTable.props('cookies')).toEqual(documentCookies)
    })

    it('uses workspace cookies when collectionType is workspace', () => {
      const workspaceCookies = [{ name: 'workspaceCookie', value: 'value123', domain: 'test.com' }]

      const workspaceStore = createWorkspaceStoreInstance()
      workspaceStore.workspace['x-scalar-cookies'] = workspaceCookies

      const props = createWorkspaceProps({ workspaceStore })
      const wrapper = mount(Cookies, { props })

      const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
      expect(cookiesTable.props('cookies')).toEqual(workspaceCookies)
    })

    it('defaults to empty array when document cookies are undefined', () => {
      const document = coerceValue(OpenAPIDocumentSchema, {
        info: {
          title: 'Test API',
        },
      })
      // Explicitly ensure x-scalar-cookies is not set
      delete document['x-scalar-cookies']

      const props = createDocumentProps({ document })
      const wrapper = mount(Cookies, { props })

      const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
      expect(cookiesTable.props('cookies')).toEqual([])
    })

    it('defaults to empty array when workspace cookies are undefined', () => {
      const workspaceStore = createWorkspaceStoreInstance()
      // Explicitly ensure x-scalar-cookies is not set
      delete workspaceStore.workspace['x-scalar-cookies']

      const props = createWorkspaceProps({ workspaceStore })
      const wrapper = mount(Cookies, { props })

      const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
      expect(cookiesTable.props('cookies')).toEqual([])
    })

    it('handles empty array cookies from document', () => {
      const document = coerceValue(OpenAPIDocumentSchema, {
        info: {
          title: 'Test API',
        },
        'x-scalar-cookies': [],
      })

      const props = createDocumentProps({ document })
      const wrapper = mount(Cookies, { props })

      const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
      expect(cookiesTable.props('cookies')).toEqual([])
    })

    it('handles empty array cookies from workspace', () => {
      const workspaceStore = createWorkspaceStoreInstance()
      workspaceStore.workspace['x-scalar-cookies'] = []

      const props = createWorkspaceProps({ workspaceStore })
      const wrapper = mount(Cookies, { props })

      const cookiesTable = wrapper.findComponent({ name: 'CookiesTable' })
      expect(cookiesTable.props('cookies')).toEqual([])
    })
  })
})
