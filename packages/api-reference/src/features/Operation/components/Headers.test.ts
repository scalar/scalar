import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import {
  SCHEMA_EXPANSION_SYMBOL,
  createSchemaExpansionStore,
} from '@/components/Content/Schema/helpers/schema-expansion'
import { scrollTargetId } from '@/helpers/lazy-bus'

import Headers from './Headers.vue'

/** Two response headers, enough for the group to have something to open. */
const headers = {
  'X-Rate-Limit': {
    description: 'Requests left in the window',
    schema: coerceValue(SchemaObjectSchema, { type: 'integer' }),
  },
  'X-Request-Id': {
    schema: coerceValue(SchemaObjectSchema, { type: 'string' }),
  },
}

const baseProps = {
  headers,
  eventBus: null,
  breadcrumb: ['op', 'responses', '200'],
  orderRequiredPropertiesFirst: false,
  orderSchemaPropertiesBy: 'alpha' as const,
  expandAllSchemaProperties: false,
  hideModels: false,
  schemaKeyboardNav: false,
}

const mountHeaders = (
  props: Partial<typeof baseProps> & { schemaLayout: 'legacy' | 'tree' },
  store = createSchemaExpansionStore(),
) =>
  mount(Headers, {
    props: { ...baseProps, ...props },
    global: { provide: { [SCHEMA_EXPANSION_SYMBOL as symbol]: store } },
  })

describe('Headers', () => {
  afterEach(() => {
    scrollTargetId.value = ''
  })

  describe('layout', () => {
    it('renders the legacy headers card in the legacy layout', () => {
      const wrapper = mountHeaders({ schemaLayout: 'legacy' })

      expect(wrapper.find('.headers-card').exists()).toBe(true)
      expect(wrapper.find('.headers-tree-group').exists()).toBe(false)
    })

    it('renders a gutter-toggled group in the tree layout', () => {
      const wrapper = mountHeaders({ schemaLayout: 'tree' })

      expect(wrapper.find('.headers-tree-group').exists()).toBe(true)
      expect(wrapper.find('.headers-card').exists()).toBe(false)
      expect(wrapper.find('.property-toggle').attributes('aria-expanded')).toBe('false')
    })

    it('puts the rows in a list so each one belongs to something', () => {
      const wrapper = mountHeaders({ schemaLayout: 'tree', expandAllSchemaProperties: true })

      // Every header renders a `SchemaProperty`, whose root is an `li`. Outside
      // a list an `li` is exposed as a plain generic and the group loses the
      // "1 of 2" position the schema rows announce.
      const list = wrapper.find('.property-children ul')

      expect(list.exists()).toBe(true)
      // The theme reset strips `list-style`, which makes Safari and VoiceOver
      // drop list semantics unless the role is spelled out.
      expect(list.attributes('role')).toBe('list')
      expect(list.findAll('li').length).toBe(2)
    })
  })

  describe('expansion key', () => {
    it('opens for a deep link written against the public anchor path', async () => {
      const wrapper = mountHeaders({ schemaLayout: 'tree' })

      scrollTargetId.value = 'op.responses.200.headers.X-Rate-Limit'
      await nextTick()

      // The group keys itself `~headers`, which is not a prefix of the anchor,
      // so it has to tell the store which path it actually covers.
      expect(wrapper.find('.property-toggle').attributes('aria-expanded')).toBe('true')
    })

    it('stays closed when a body property of the same name opens', async () => {
      const store = createSchemaExpansionStore()
      const wrapper = mountHeaders({ schemaLayout: 'tree' }, store)

      // A response body property literally named `headers` writes the plain key.
      store.setExpanded('op.responses.200.headers', true)
      await nextTick()

      expect(wrapper.find('.property-toggle').attributes('aria-expanded')).toBe('false')
    })

    it('uses the same marked key a committed deep link writes', async () => {
      const store = createSchemaExpansionStore()
      const wrapper = mountHeaders({ schemaLayout: 'tree' }, store)

      // `commitPath` derives `~headers` from the anchor path; the two spellings
      // have to agree or the group re-collapses once the target clears.
      store.commitPath('op.responses.200.headers')
      await nextTick()

      expect(wrapper.find('.property-toggle').attributes('aria-expanded')).toBe('true')
    })
  })
})
