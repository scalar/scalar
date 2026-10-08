import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { type VueWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { SectionHeader } from '@/components/Section'

import InfoBlock from './InfoBlock.vue'

enableAutoUnmount(afterEach)

describe('InfoBlock', () => {
  const eventBus = createWorkspaceEventBus()
  const mockInfo = {
    title: 'Test API',
    version: '1.0.0',
  } satisfies InfoObject

  it('uses "after" slot for classic layout', () => {
    const wrapper = mount(InfoBlock, {
      props: {
        info: mockInfo,
        headingSlugGenerator: () => '',
        layout: 'classic',
        eventBus,
      },
      slots: {
        selectors: '<div data-testid="selectors">Selectors Content</div>',
      },
    })

    expect(wrapper.find('[data-testid="selectors"]').exists()).toBe(true)
  })

  it('uses "aside" slot for modern layout', () => {
    const wrapper = mount(InfoBlock, {
      props: {
        info: mockInfo,
        layout: 'modern',
        headingSlugGenerator: () => '',
        eventBus,
      },
      slots: {
        selectors: '<div data-testid="selectors">Selectors Content</div>',
      },
    })

    expect(wrapper.find('[data-testid="selectors"]').exists()).toBe(true)
  })

  const externalDocs = {
    url: 'https://example.com/integration-guide',
    description: 'Integration guide',
  }

  const mountIntroduction = (
    props: Pick<InstanceType<typeof InfoBlock>['$props'], 'info' | 'externalDocs' | 'documentType'>,
    layout: 'modern' | 'classic',
  ): VueWrapper =>
    mount(InfoBlock, {
      props: { ...props, layout, documentDownloadType: 'none', headingSlugGenerator: () => '', eventBus },
    })

  it.each(['modern', 'classic'] as const)('renders inline AsyncAPI external documentation in %s layout', (layout) => {
    const wrapper = mountIntroduction({ documentType: 'asyncapi', info: { ...mockInfo, externalDocs } }, layout)
    const link = wrapper.getComponent(SectionHeader).get('a')
    expect(link.attributes('href')).toBe(externalDocs.url)
    expect(wrapper.text()).toContain(externalDocs.description)
    expect(link.attributes('target')).toBe('_blank')
  })

  it.each(['modern', 'classic'] as const)(
    'resolves chained AsyncAPI external documentation in %s layout',
    async (layout) => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'events',
        document: {
          asyncapi: '3.0.0',
          info: { ...mockInfo, externalDocs: { $ref: '#/components/externalDocs/guide' } },
          channels: {},
          components: {
            externalDocs: { guide: { $ref: '#/components/externalDocs/integration' }, integration: externalDocs },
          },
        },
      })
      const wrapper = mountIntroduction(
        { documentType: 'asyncapi', info: store.workspace.documents.events?.info },
        layout,
      )
      expect(wrapper.get('a').attributes('href')).toBe(externalDocs.url)
      expect(wrapper.text()).toContain(externalDocs.description)
    },
  )

  it.each(['modern', 'classic'] as const)(
    'renders upgraded AsyncAPI 2.x external documentation in %s layout',
    async (layout) => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'events',
        document: {
          asyncapi: '2.6.0',
          info: mockInfo,
          channels: {},
          externalDocs,
        },
      })
      const wrapper = mountIntroduction(
        { documentType: 'asyncapi', info: store.workspace.documents.events?.info },
        layout,
      )
      expect(wrapper.get('a').attributes('href')).toBe(externalDocs.url)
    },
  )

  it.each(['modern', 'classic'] as const)('prefers an explicit external documentation prop in %s layout', (layout) => {
    const wrapper = mountIntroduction(
      {
        documentType: 'asyncapi',
        info: { ...mockInfo, externalDocs },
        externalDocs: { url: 'https://example.com/override' },
      },
      layout,
    )
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com/override')
  })

  it.each(['modern', 'classic'] as const)('keeps OpenAPI external documentation in %s layout', (layout) => {
    const wrapper = mountIntroduction({ documentType: 'openapi', info: mockInfo, externalDocs }, layout)
    expect(wrapper.get('a').attributes('href')).toBe(externalDocs.url)
  })

  it('does not treat an OpenAPI info extension as AsyncAPI external documentation', () => {
    const wrapper = mountIntroduction({ documentType: 'openapi', info: { ...mockInfo, externalDocs } }, 'modern')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it.each(['modern', 'classic'] as const)(
    'omits missing or unresolved AsyncAPI external documentation in %s layout',
    (layout) => {
      for (const info of [
        mockInfo,
        { ...mockInfo, externalDocs: { $ref: '#/components/externalDocs/missing' } },
      ] satisfies AsyncApiInfoObject[]) {
        const wrapper = mountIntroduction({ documentType: 'asyncapi', info }, layout)
        expect(wrapper.find('a').exists()).toBe(false)
        expect(wrapper.text()).not.toContain(externalDocs.description)
      }
    },
  )

  it.each(['modern', 'classic'] as const)(
    'sanitizes unsafe AsyncAPI external documentation URLs in %s layout',
    (layout) => {
      const wrapper = mountIntroduction(
        {
          documentType: 'asyncapi',
          info: { ...mockInfo, externalDocs: { ...externalDocs, url: 'javascript:alert(1)' } },
        },
        layout,
      )
      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.text()).toContain(externalDocs.description)
    },
  )

  it.each(['modern', 'classic'] as const)(
    'renders the root identifier from loaded AsyncAPI documents in %s layout',
    async (layout) => {
      for (const asyncapi of ['2.6.0', '3.0.0', '3.1.0']) {
        const store = createWorkspaceStore()
        await store.addDocument({
          name: 'events',
          document: { asyncapi, id: 'urn:example:events', info: mockInfo, channels: {} },
        })
        const document = store.workspace.documents.events
        const wrapper = mount(InfoBlock, {
          props: {
            id: 'events/introduction',
            applicationIdentifier: document && 'id' in document ? document.id : undefined,
            documentType: 'asyncapi',
            info: document?.info,
            specificationVersion: asyncapi,
            layout,
            documentDownloadType: 'none',
            headingSlugGenerator: () => '',
            eventBus,
          },
        })
        expect(wrapper.get('dt').text()).toBe('Application identifier')
        expect(wrapper.get('dd').text()).toBe('urn:example:events')
        expect(wrapper.get('section').attributes('id')).toBe('events/introduction')
      }
    },
  )
})
