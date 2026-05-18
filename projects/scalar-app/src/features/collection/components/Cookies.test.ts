import { mockEventBus } from '@scalar/api-client/v2/helpers/test-utils'
import type { XScalarEnvironment } from '@scalar/types/extensions/document'
import type { OpenApiDocument } from '@scalar/types/openapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionProps } from '@/features/app/helpers/routes'

import Cookies from './Cookies.vue'

describe('Cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseEnvironment = {
    color: '#FFFFFF',
    variables: [],
  } satisfies XScalarEnvironment

  const createWorkspaceStoreInstance = () => {
    const store = createWorkspaceStore()
    return store
  }

  const createDocumentProps = (overrides: Partial<CollectionProps> = {}) => {
    const document = {
      openapi: '3.1.0',
      'x-scalar-original-document-hash': 'test-hash',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test description',
      },
    } satisfies OpenApiDocument

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

      const document = {
        openapi: '3.1.0',
        'x-scalar-original-document-hash': 'test-hash',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        'x-scalar-cookies': documentCookies,
      } satisfies OpenApiDocument

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
      const document = {
        openapi: '3.1.0',
        'x-scalar-original-document-hash': 'test-hash',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      } satisfies OpenApiDocument

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
      const document = {
        openapi: '3.1.0',
        'x-scalar-original-document-hash': 'test-hash',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        'x-scalar-cookies': [],
      } satisfies OpenApiDocument

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
