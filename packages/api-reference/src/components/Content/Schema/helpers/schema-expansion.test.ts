import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

import { scrollTargetId } from '@/helpers/lazy-bus'

import { createSchemaExpansionStore, provideSchemaExpansion, toNodeKey } from './schema-expansion'

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

    it('still opens a cyclic node the reader asked for by hand', () => {
      const store = createSchemaExpansionStore()

      store.setExpanded('user.friend', true)

      // Only the automatic openings are suppressed on a cycle. One deliberate
      // step into a self-referential schema is finite, so it is allowed.
      expect(store.isExpanded('user.friend', { cyclic: true })).toBe(true)
    })

    it('still opens a cyclic node a deep link points into', () => {
      const store = createSchemaExpansionStore()

      scrollTargetId.value = 'user.friend.name'

      // A shared link names one finite path, so it survives the cycle guard —
      // otherwise a link into a recursive model lands on a collapsed row.
      expect(store.isExpanded('user.friend', { cyclic: true })).toBe(true)
    })

    it('lets an explicit collapse win over a live deep link', () => {
      const store = createSchemaExpansionStore()

      scrollTargetId.value = 'user.address.city'
      store.setExpanded('user.address', false)

      // The reader closed it after landing; the still-set target must not force
      // it open again on the next render.
      expect(store.isExpanded('user.address')).toBe(false)
    })

    it('lets a collapsed baseline win over defaultOpen', () => {
      const store = createSchemaExpansionStore()

      store.collapseAll()

      // `expandAllSchemaProperties` is exactly this `defaultOpen`, so without
      // the baseline check "Collapse all" would do nothing on such a document.
      expect(store.isExpanded('user.address', { defaultOpen: true })).toBe(false)
    })

    it('opens a marked key for a deep link written against its anchor path', () => {
      const store = createSchemaExpansionStore()

      scrollTargetId.value = 'op.responses.200.headers.X-Rate-Limit'

      // The response-headers group keys itself `~headers`, which is not a
      // prefix of any anchor. Without the hint the link opens nothing.
      expect(store.isExpanded('op.responses.200.~headers', { anchorPath: 'op.responses.200.headers' })).toBe(true)
      expect(store.isExpanded('op.responses.200.~headers')).toBe(false)
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

    it('treats the root as a whole path segment, not a string prefix', () => {
      const store = createSchemaExpansionStore()

      store.setExpanded('username', true)

      store.expandAll('user')

      // `username` merely starts with `user`; it is a sibling, not a child, so
      // its state is none of this bulk action's business.
      expect(store.isExpanded('username')).toBe(true)
    })

    it('replaces a narrower bulk root when a broader one lands on top', () => {
      const store = createSchemaExpansionStore()

      store.collapseAll('user.address')
      expect(store.isExpanded('user.address.city')).toBe(false)

      store.expandAll('user')

      // Newest intent wins for bulk roots too, or the older, narrower action
      // keeps overriding the one the reader just asked for.
      expect(store.isExpanded('user.address.city')).toBe(true)
    })
  })

  describe('collapseAll', () => {
    it('closes a node the user previously opened', () => {
      const store = createSchemaExpansionStore()

      store.setExpanded('user.address', true)
      store.collapseAll()

      expect(store.isExpanded('user.address')).toBe(false)
    })

    it('supersedes every narrower bulk action when it covers the document', () => {
      const store = createSchemaExpansionStore()

      store.expandAll('user.address')

      store.collapseAll()

      expect(store.isExpanded('user.address.city')).toBe(false)
    })
  })

  describe('until-found budget', () => {
    /** Take slots until the store refuses, returning how many it handed out. */
    const drain = (store: ReturnType<typeof createSchemaExpansionStore>): number => {
      let granted = 0

      // Bounded so a missing cap fails the test instead of hanging it.
      while (granted < 5_000 && store.untilFound.acquire()) {
        granted += 1
      }

      return granted
    }

    it('caps how many closed panels one store keeps mounted', () => {
      const store = createSchemaExpansionStore()

      const granted = drain(store)

      // The exact number is a tuning decision; an unbounded budget is the bug,
      // because every retained panel keeps its whole subtree in the DOM.
      expect(granted).toBeGreaterThan(0)
      expect(granted).toBeLessThan(5_000)
      expect(store.untilFound.acquire()).toBe(false)
    })

    it('hands a slot back when a retained panel reopens', () => {
      const store = createSchemaExpansionStore()

      drain(store)
      expect(store.untilFound.acquire()).toBe(false)

      store.untilFound.release()

      // Without this the budget only ever shrinks and find-in-page retention
      // fails silently page-wide after enough toggling.
      expect(store.untilFound.acquire()).toBe(true)
    })

    it('refuses slots for the flush a bulk transition closes rows in', async () => {
      const store = createSchemaExpansionStore()

      store.pauseRetentionFor(() => {
        expect(store.untilFound.acquire()).toBe(false)
      })

      expect(store.untilFound.acquire()).toBe(false)

      await nextTick()

      expect(store.untilFound.acquire()).toBe(true)
    })

    it('pauses retention while collapsing everything', async () => {
      const store = createSchemaExpansionStore()

      store.collapseAll()

      // One gesture closes every open row; letting each keep its panel would
      // drain the whole budget and pin hundreds of hidden subtrees.
      expect(store.untilFound.acquire()).toBe(false)

      await nextTick()

      expect(store.untilFound.acquire()).toBe(true)
    })

    it('leaves an expansion free to retain', () => {
      const store = createSchemaExpansionStore()

      store.expandAll()

      // Expanding closes nothing, so there is no reason to hold the budget shut.
      expect(store.untilFound.acquire()).toBe(true)
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

  describe('provideSchemaExpansion', () => {
    /** Own a store the way `<ApiReference>` does, hooks and all. */
    const mountOwner = () => {
      let store!: ReturnType<typeof provideSchemaExpansion>

      const wrapper = mount(
        defineComponent({
          setup() {
            store = provideSchemaExpansion()
            return () => h('div')
          },
        }),
      )

      return { store, wrapper }
    }

    it('commits a deep link that was already in the URL at mount', () => {
      scrollTargetId.value = 'user.address.city'

      const { store, wrapper } = mountOwner()

      // Clearing the target proves the path was committed as overrides rather
      // than merely matching while the link was live.
      scrollTargetId.value = ''

      expect(store.isExpanded('user.address')).toBe(true)

      wrapper.unmount()
    })

    it('commits a deep link that arrives after mount', async () => {
      const { store, wrapper } = mountOwner()

      scrollTargetId.value = 'order.items.sku'
      await nextTick()
      scrollTargetId.value = ''

      expect(store.isExpanded('order.items')).toBe(true)

      wrapper.unmount()
    })

    it('expands everything to print, then puts the reader state back', () => {
      const { store, wrapper } = mountOwner()

      store.collapseAll()
      expect(store.isExpanded('user.address', { defaultOpen: true })).toBe(false)

      window.dispatchEvent(new Event('beforeprint'))

      // A printed page cannot be expanded by the reader, so everything opens.
      expect(store.isExpanded('user.address', { defaultOpen: true })).toBe(true)

      window.dispatchEvent(new Event('afterprint'))

      expect(store.isExpanded('user.address', { defaultOpen: true })).toBe(false)

      wrapper.unmount()
    })

    it('stops listening for print events once the reference unmounts', () => {
      const { store, wrapper } = mountOwner()

      wrapper.unmount()

      window.dispatchEvent(new Event('beforeprint'))

      // Two references on one page, one of them torn down: a leaked listener
      // would flip the dead store's baseline on every print.
      expect(store.baseline.value).toBe('default')
    })
  })
})
