import type { ApiReferencePlugin, PluginDocumentType } from '@scalar/types/api-reference'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import ApiReference from '@/components/ApiReference.vue'

// The global test setup replaces the plugin manager with an empty one; these tests need the real one.
vi.mock('@/plugins/hooks/usePluginManager', async (importOriginal) => await importOriginal())

enableAutoUnmount(afterEach)

const arazzoDocument = {
  arazzo: '1.0.1',
  info: { title: 'Pet adoption', version: '1.0.0' },
  sourceDescriptions: [{ name: 'petstore', url: './petstore.json', type: 'openapi' }],
  workflows: [{ workflowId: 'adopt-a-pet', summary: 'Adopt a pet', steps: [] }],
}

/** Renders each workflow as a section whose id matches its sidebar entry. */
const ArazzoContent = defineComponent({
  name: 'ArazzoContent',
  props: {
    document: { type: Object, required: true },
    documentName: { type: String, required: true },
    documents: { type: Object, required: true },
    navigation: { type: Array, required: true },
  },
  setup: (props) => () =>
    h(
      'div',
      { class: 'arazzo-content' },
      (props.navigation as { id: string; title: string }[]).map((entry) => h('section', { id: entry.id }, entry.title)),
    ),
})

const arazzoDocumentType: PluginDocumentType = {
  type: 'arazzo',
  detect: (document) => typeof document.arazzo === 'string',
  traverse: ({ documentId, document }) =>
    (document.workflows as { workflowId: string; summary: string }[]).map((workflow) => ({
      id: `${documentId}/workflow/${workflow.workflowId}`,
      title: workflow.summary,
      kind: 'workflow',
    })),
  content: { component: ArazzoContent },
}

const arazzoPlugin: ApiReferencePlugin = () => ({
  name: 'arazzo',
  extensions: [],
  documentTypes: [arazzoDocumentType],
})

describe('ApiReference.document-types', () => {
  it('switches between built-in and plugin documents without exposing unsupported agent or search content', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: {
          plugins: [arazzoPlugin],
          agent: { key: 'test-key' },
          sources: [
            { slug: 'http', content: { openapi: '3.1.0', info: { title: 'HTTP', version: '1' }, paths: {} } },
            { slug: 'events', content: { asyncapi: '3.1.0', info: { title: 'Events', version: '1' }, channels: {} } },
            {
              slug: 'adoption',
              content: { ...arazzoDocument, openapi: '3.1.0', asyncapi: '3.1.0', paths: {}, servers: [] },
            },
          ],
        },
      },
    })
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'AgentScalarButton' }).exists()).toBe(true))
    const selector = wrapper.getComponent({ name: 'DocumentSelector' })
    for (const slug of ['events', 'adoption', 'http', 'adoption']) {
      selector.vm.$emit('update:modelValue', slug)
      await flushPromises()
      await vi.waitFor(() => expect(wrapper.findComponent(ArazzoContent).exists()).toBe(slug === 'adoption'))
      expect(wrapper.findComponent({ name: 'InfoBlock' }).exists()).toBe(slug !== 'adoption')
      expect(wrapper.findComponent({ name: 'AgentScalarButton' }).exists()).toBe(slug !== 'adoption')
      if (slug === 'adoption') {
        expect(wrapper.getComponent({ name: 'SearchModal' }).props('document')).toBeUndefined()
        expect(wrapper.getComponent(ArazzoContent).props('navigation')).toMatchObject([
          { id: 'adoption/workflow/adopt-a-pet' },
        ])
      }
    }
  })

  it('renders a claimed document with the plugin content component', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: { slug: 'adoption', content: arazzoDocument, plugins: [arazzoPlugin] },
      },
    })
    await vi.waitFor(() => expect(wrapper.findComponent(ArazzoContent).exists()).toBe(true))

    const content = wrapper.findComponent(ArazzoContent)
    expect(content.exists()).toBe(true)
    expect(content.props('documentName')).toBe('adoption')
    expect(content.props('document')).toMatchObject({ ...arazzoDocument, 'x-scalar-document-type': 'arazzo' })
    expect(Object.keys(content.props('documents'))).toStrictEqual(['adoption'])
    expect(content.props('navigation')).toStrictEqual([
      {
        id: 'adoption/workflow/adopt-a-pet',
        title: 'Adopt a pet',
        kind: 'workflow',
        type: 'plugin',
        documentType: 'arazzo',
      },
    ])

    // The plugin owns the page: no built-in introduction
    expect(wrapper.find('#adoption\\/workflow\\/adopt-a-pet').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'InfoBlock' }).exists()).toBe(false)
  })

  it('lists the plugin navigation entries in the sidebar', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: { slug: 'adoption', content: arazzoDocument, plugins: [arazzoPlugin] },
      },
    })
    await vi.waitFor(() => expect(wrapper.findComponent(ArazzoContent).exists()).toBe(true))

    expect(wrapper.find('nav, aside').exists()).toBe(true)
    expect(wrapper.findAll('nav, aside').some((element) => element.text().includes('Adopt a pet'))).toBe(true)
  })

  it('renders documents nobody claims with the built-in content', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: {
          content: { openapi: '3.1.0', info: { title: 'Petstore', version: '1.0.0' }, paths: {} },
          plugins: [arazzoPlugin],
        },
      },
    })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Petstore'))

    expect(wrapper.findComponent(ArazzoContent).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'InfoBlock' }).exists()).toBe(true)
  })
})
