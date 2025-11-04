import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { xScalarEnvironmentsSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { EnvironmentsList } from '@/v2/features/environments'
import { mockEventBus } from '@/v2/helpers/test-utils'

import Environment from './Environment.vue'

const mockEnvironments = coerceValue(xScalarEnvironmentsSchema, {
  'x-scalar-environments': {
    production: {
      color: '#FF0000',
      variables: [
        { name: 'API_URL', value: 'https://api.production.com' },
        { name: 'API_KEY', value: 'prod-key-123', color: '' },
      ],
    },
    development: {
      color: '#00FF00',
      variables: [
        { uid: '3' as any, name: 'API_URL', value: 'https://api.dev.com', color: '' },
        { uid: '4' as any, name: 'API_KEY', value: 'dev-key-456', color: '' },
      ],
    },
  },
})['x-scalar-environments']!

const createMockDocument = (environments?: any) =>
  ({
    name: 'Test Document',
    'x-scalar-environments': environments,
  }) as unknown as WorkspaceDocument

const createMockWorkspaceStore = (environments?: any): WorkspaceStore =>
  ({
    workspace: {
      name: 'Test Workspace',
      'x-scalar-environments': environments,
    },
  }) as any

describe('Environment', () => {
  describe('rendering', () => {
    it('renders the heading and description text', () => {
      const wrapper = mount(Environment, {
        props: {
          document: createMockDocument(),
          eventBus: mockEventBus,
          collectionType: 'document',
          workspaceStore: createMockWorkspaceStore(),
          layout: 'desktop',
          environment: {} as any,
        },
      })

      expect(wrapper.text()).toContain('Environment Variables')
      expect(wrapper.text()).toContain('Set environment variables at your collection level')
    })

    it('renders the variable placeholder syntax in the description', () => {
      const wrapper = mount(Environment, {
        props: {
          document: createMockDocument(),
          eventBus: mockEventBus,
          collectionType: 'document',
          workspaceStore: createMockWorkspaceStore(),
          layout: 'desktop' as any,
          environment: {} as any,
        },
      })

      /**
       * The component displays {{ variable }} syntax for users to reference
       * environment variables in their requests.
       */
      expect(wrapper.text()).toContain('{{ variable }}')
    })

    it('renders EnvironmentsList component', () => {
      const wrapper = mount(Environment, {
        props: {
          document: createMockDocument(mockEnvironments),
          eventBus: mockEventBus,
          collectionType: 'document',
          workspaceStore: createMockWorkspaceStore(),
          layout: 'desktop' as any,
          environment: {} as any,
        },
      })

      const environmentsList = wrapper.findComponent(EnvironmentsList)
      expect(environmentsList.exists()).toBe(true)
    })
  })

  describe('computed environments', () => {
    it('uses document environments when collectionType is document', () => {
      const wrapper = mount(Environment, {
        props: {
          document: createMockDocument(mockEnvironments),
          eventBus: mockEventBus,
          collectionType: 'document',
          workspaceStore: createMockWorkspaceStore({ workspace: {} }),
          layout: 'desktop' as any,
          environment: {} as any,
        },
      })

      const environmentsList = wrapper.findComponent(EnvironmentsList)
      expect(environmentsList.props('environments')).toEqual(mockEnvironments)
    })

    it('uses workspace environments when collectionType is workspace', () => {
      const workspaceEnvironments = {
        staging: {
          color: '#0000FF',
          variables: [{ uid: '5' as any, name: 'API_URL', value: 'https://api.staging.com', color: '' }],
        },
      }

      const wrapper = mount(Environment, {
        props: {
          document: null,
          eventBus: mockEventBus,
          collectionType: 'workspace',
          workspaceStore: createMockWorkspaceStore(workspaceEnvironments),
          layout: 'desktop' as any,
          environment: {} as any,
        },
      })

      const environmentsList = wrapper.findComponent(EnvironmentsList)
      expect(environmentsList.props('environments')).toEqual(workspaceEnvironments)
    })

    it('defaults to empty object when environments are missing', () => {
      const wrapper = mount(Environment, {
        props: {
          document: createMockDocument(undefined),
          eventBus: mockEventBus,
          collectionType: 'document',
          workspaceStore: createMockWorkspaceStore(),
          layout: 'desktop' as any,
          environment: {} as any,
        },
      })

      /**
       * When x-scalar-environments is undefined or null,
       * the component should provide an empty object as a fallback
       * to prevent errors in child components.
       */
      const environmentsList = wrapper.findComponent(EnvironmentsList)
      expect(environmentsList.props('environments')).toEqual({})
    })
  })

  describe('props passed to EnvironmentsList', () => {
    it('passes correct props to EnvironmentsList component', () => {
      const wrapper = mount(Environment, {
        props: {
          document: createMockDocument(mockEnvironments),
          eventBus: mockEventBus,
          collectionType: 'document',
          workspaceStore: createMockWorkspaceStore(),
          layout: 'desktop' as any,
          environment: {} as any,
        },
      })

      const environmentsList = wrapper.findComponent(EnvironmentsList)

      /**
       * EnvironmentsList needs these props to function properly.
       * It uses collectionType to determine where to save changes,
       * environments to display the list, and eventBus to emit events.
       */
      expect(environmentsList.props('collectionType')).toBe('document')
      expect(environmentsList.props('environments')).toEqual(mockEnvironments)
      expect(environmentsList.props('eventBus')).toStrictEqual(mockEventBus)
    })
  })
})
