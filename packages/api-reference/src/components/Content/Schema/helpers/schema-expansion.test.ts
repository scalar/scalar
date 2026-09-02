import { afterEach, describe, expect, it } from 'vitest'

import { scrollTargetId } from '@/helpers/lazy-bus'

import { createSchemaExpansionStore, toNodeKey } from './schema-expansion'

describe('schema-expansion', () => {
  afterEach(() => {
    scrollTargetId.value = ''
  })

  describe('toNodeKey', () => {
    it('joins a breadcrumb into the anchor path', () => {
      expect(toNodeKey(['user', 'address', 'city'])).toBe('user.address.city')
    })

    it('returns an empty key for a missing breadcrumb', () => {
      expect(toNodeKey(undefined)).toBe('')
    })
  })

  describe('resolution order', () => {
    it('prefers an explicit override over everything else', () => {
      const store = createSchemaExpansionStore()

      store.setExpanded('user', false)

      expect(store.isExpanded('user', { defaultOpen: true })).toBe(false)
    })

    it('falls back to defaultOpen when nothing else applies', () => {
      const store = createSchemaExpansionStore()

      expect(store.isExpanded('user', { defaultOpen: true })).toBe(true)
      expect(store.isExpanded('user', { defaultOpen: false })).toBe(false)
    })

    it('opens every node on the path to the scroll target', () => {
      const store = createSchemaExpansionStore()

      scrollTargetId.value = 'user.address.city'

      expect(store.isExpanded('user')).toBe(true)
      expect(store.isExpanded('user.address')).toBe(true)
      expect(store.isExpanded('user.address.city')).toBe(true)
      expect(store.isExpanded('user.contact')).toBe(false)
    })

    it('applies a bulk root to the nodes beneath it', () => {
      const store = createSchemaExpansionStore()

      store.expandAll('user.address')

      expect(store.isExpanded('user.address.city')).toBe(true)
      expect(store.isExpanded('user.contact')).toBe(false)
    })

    it('ignores bulk expansion and the baseline for cyclic nodes', () => {
      const store = createSchemaExpansionStore()

      store.expandAll()

      // Without this a self-referential schema expands forever.
      expect(store.isExpanded('user.friend', { cyclic: true })).toBe(false)
      expect(store.isExpanded('user.name')).toBe(true)
    })
  })

  describe('expandAll', () => {
    it('reopens a node the user previously collapsed', () => {
      const store = createSchemaExpansionStore()

      store.setExpanded('user.address', false)
      expect(store.isExpanded('user.address')).toBe(false)

      store.expandAll()

      // Newest intent wins, otherwise "Expand all" silently skips every node
      // the reader has ever touched.
      expect(store.isExpanded('user.address')).toBe(true)
    })

    it('only clears the overrides beneath its own root', () => {
      const store = createSchemaExpansionStore()

      store.setExpanded('user.address', false)
      store.setExpanded('order.items', false)

      store.expandAll('user')

      expect(store.isExpanded('user.address')).toBe(true)
      expect(store.isExpanded('order.items')).toBe(false)
    })
  })

  describe('collapseAll', () => {
    it('closes a node the user previously opened', () => {
      const store = createSchemaExpansionStore()

      store.setExpanded('user.address', true)
      store.collapseAll()

      expect(store.isExpanded('user.address')).toBe(false)
    })
  })

  describe('commitPath', () => {
    it('opens the target and every ancestor as explicit overrides', () => {
      const store = createSchemaExpansionStore()

      store.commitPath('user.address.city')

      // Overrides rather than a transient match, so the expansion survives the
      // scroll target being cleared.
      scrollTargetId.value = ''

      expect(store.isExpanded('user')).toBe(true)
      expect(store.isExpanded('user.address')).toBe(true)
      expect(store.isExpanded('user.address.city')).toBe(true)
    })

    it('leaves the committed expansion collapsible by the reader', () => {
      const store = createSchemaExpansionStore()

      store.commitPath('user.address')
      store.setExpanded('user.address', false)

      expect(store.isExpanded('user.address')).toBe(false)
    })
  })

  describe('toggle', () => {
    it('flips a node that was open only by default', () => {
      const store = createSchemaExpansionStore()

      store.toggle('user', { defaultOpen: true })

      expect(store.isExpanded('user', { defaultOpen: true })).toBe(false)
    })
  })
  describe('structural marker keys', () => {
    it('commits the marked form of every segment on the path', () => {
      const store = createSchemaExpansionStore()

      store.commitPath('op.responses.200.headers.X-Rate-Limit')

      // The response-headers GROUP keys itself `~headers` so it cannot collide
      // with a body property named `headers`; the commit has to reach it or the
      // group re-collapses the moment the scroll target clears, unmounting the
      // row the deep link just landed on.
      expect(store.isExpanded('op.responses.200.~headers', { defaultOpen: false })).toBe(true)
    })

    it('derives the commit without needing the node to be mounted first', () => {
      const store = createSchemaExpansionStore()

      // Operations mount lazily, so nothing that renders the target exists yet
      // when the deep link is committed. The marked form is derived from the
      // path, so ordering cannot matter.
      store.commitPath('op.responses.404.headers')

      expect(store.isExpanded('op.responses.404.~headers', { defaultOpen: false })).toBe(true)
    })

    it('leaves a marked key alone when the reader expands a same-named node', () => {
      const store = createSchemaExpansionStore()

      // A body property literally named `headers` writes the plain key. That
      // must not open the unrelated response-headers group.
      store.setExpanded('op.responses.200.headers', true)

      expect(store.isExpanded('op.responses.200.~headers', { defaultOpen: false })).toBe(false)
    })
  })
})
