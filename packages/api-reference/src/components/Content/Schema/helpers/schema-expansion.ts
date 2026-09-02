import {
  type InjectionKey,
  type Ref,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowReactive,
  shallowRef,
  watch,
} from 'vue'

import { scrollTargetId } from '@/helpers/lazy-bus'

/**
 * What a node does when nobody has expressed an opinion about it: its own
 * `defaultOpen`, or whatever expand-all / collapse-all last set.
 */
type ExpansionBaseline = 'default' | 'expanded' | 'collapsed'

/** What the store cannot work out about a node on its own. */
type ExpansionContext = {
  /**
   * Whether this node sits on a `$ref` cycle. Bulk expansion and the baseline
   * skip cyclic nodes; without that, `expandAll()` on a self-referential schema
   * never terminates, because the cycle guard only suppresses auto-expansion.
   */
  cyclic?: boolean
  /** What the node would do with no store at all (its `defaultOpen`). */
  defaultOpen?: boolean
  /**
   * The public anchor path this node covers, when it differs from its key. A
   * key carrying a structural marker (`~headers`) must still open for a deep
   * link written against the anchor path (`…headers.X-Rate`).
   */
  anchorPath?: string
}

type SchemaExpansionStore = {
  /** Resolve whether a node is open. See the resolution order below. */
  isExpanded: (key: string, ctx?: ExpansionContext) => boolean
  /** Record an explicit user decision about one node. */
  setExpanded: (key: string, value: boolean) => void
  /** Flip one node, resolving its current state first. */
  toggle: (key: string, ctx?: ExpansionContext) => void
  /** Expand everything, or everything beneath `root`. */
  expandAll: (root?: string) => void
  /** Collapse everything, or everything beneath `root`. */
  collapseAll: (root?: string) => void
  /** Make a deep link's expansion permanent by opening every ancestor of `path`. */
  commitPath: (path: string) => void
  /** The standing baseline, exposed so a print hook can flip it and put it back. */
  baseline: Ref<ExpansionBaseline>
  /**
   * Tree-wide budget for closed panels kept in the DOM as `hidden="until-found"`.
   * Kept panels stay searchable with find-in-page but grow the DOM, so a closing
   * row asks `acquire()` first and simply unmounts past the cap. Deliberately
   * not reactive: it only matters at the moment a panel closes.
   */
  untilFound: {
    acquire: () => boolean
    release: () => void
  }
  /**
   * Run a bulk transition with slot retention paused. A collapse-all or the
   * afterprint restore closes many rows in one flush; letting each one
   * `acquire()` would drain the budget in a single gesture and pin hundreds of
   * hidden subtrees. Releases still run, so reopened rows hand slots back.
   */
  pauseRetentionFor: (mutate: () => void) => void
}

/**
 * Whether `key` is `root` or sits beneath it. A literal `.` is the separator
 * even though property names may contain one (`a.b` + `c` collides with `a` +
 * `b.c`); the key is deliberately the same string as the public anchor used by
 * the sidebar, `scrollTargetId` and shared URLs, so it cannot be re-encoded alone.
 */
const isUnder = (key: string, root: string): boolean => root === '' || key === root || key.startsWith(`${root}.`)

/**
 * Build the node key for a breadcrumb: the dot-joined anchor path, so store keys
 * and public anchors are the same string. Callers append `~`-marked structural
 * segments (`~headers`, `~anonymous-…`) for nodes the anchor cannot name.
 */
export const toNodeKey = (breadcrumb: readonly string[] | undefined): string => breadcrumb?.join('.') ?? ''

/** How many closed panels one tree keeps mounted as `hidden="until-found"`. */
const UNTIL_FOUND_CAP = 300

/**
 * A per-reference store of which schema properties are open. Sparse by
 * construction: only what somebody touched, typically under twenty keys, where
 * a dense map over a large document would be tens of thousands. The maps are
 * `shallowReactive` because a Map inside a `shallowRef` does not track `.set()`
 * (clicks would do nothing) and replacing the Map wholesale would invalidate
 * every mounted row on every toggle.
 */
export const createSchemaExpansionStore = (): SchemaExpansionStore => {
  /** Only what the user explicitly opened or closed. */
  const overrides = shallowReactive(new Map<string, boolean>())
  /** Per-subtree expand-all / collapse-all roots. */
  const bulkRoots = shallowReactive(new Map<string, boolean>())
  const baseline = shallowRef<ExpansionBaseline>('default')

  /** The nearest bulk root at or above `key`, if any. */
  const nearestBulkRoot = (key: string): boolean | undefined => {
    if (bulkRoots.size === 0) {
      return undefined
    }

    let candidate = key

    while (true) {
      const value = bulkRoots.get(candidate)

      if (value !== undefined) {
        return value
      }

      const cut = candidate.lastIndexOf('.')

      if (cut === -1) {
        return bulkRoots.get('')
      }

      candidate = candidate.slice(0, cut)
    }
  }

  /** Whether a deep link currently points at this node or inside it. */
  const isOnScrollTargetPath = (key: string): boolean => {
    const target = scrollTargetId.value

    if (!target || !key) {
      return false
    }

    return target === key || target.startsWith(`${key}.`)
  }

  /**
   * Newest intent wins: a bulk write drops the overrides beneath its root, so
   * "an explicit override always wins" never becomes "Expand all silently skips
   * every node the user has ever touched". O(overrides), which stays small.
   */
  const clearOverridesUnder = (root: string): void => {
    for (const key of [...overrides.keys()]) {
      if (isUnder(key, root)) {
        overrides.delete(key)
      }
    }
  }

  /** While true, closing rows must not take until-found slots. */
  let retentionPaused = false

  const pauseRetentionFor = (mutate: () => void): void => {
    retentionPaused = true
    mutate()

    // The closes land in the same pre-render flush as the write, so the pause can lift after it.
    void nextTick(() => {
      retentionPaused = false
    })
  }

  const setBulk = (root: string, value: boolean): void => {
    clearOverridesUnder(root)

    if (root === '') {
      // A document-wide bulk action supersedes every narrower one.
      bulkRoots.clear()
      baseline.value = value ? 'expanded' : 'collapsed'
      return
    }

    for (const existing of [...bulkRoots.keys()]) {
      if (isUnder(existing, root)) {
        bulkRoots.delete(existing)
      }
    }

    bulkRoots.set(root, value)
  }

  const isExpanded = (key: string, ctx: ExpansionContext = {}): boolean => {
    // 1. An explicit decision by the user, O(1).
    const override = overrides.get(key)

    if (override !== undefined) {
      return override
    }

    // 2 and 3 are skipped for cyclic nodes, so bulk expansion terminates.
    if (!ctx.cyclic) {
      // 2. The nearest enclosing bulk action.
      const bulk = nearestBulkRoot(key)

      if (bulk !== undefined) {
        return bulk
      }

      // 3. The standing baseline.
      if (baseline.value === 'expanded') {
        return true
      }

      if (baseline.value === 'collapsed') {
        return false
      }
    }

    // 4. A live deep link, read here rather than at mount so a second deep link
    //    into an already-rendered operation still works.
    if (isOnScrollTargetPath(ctx.anchorPath ?? key)) {
      return true
    }

    // 5. Whatever the node would have done on its own.
    return ctx.defaultOpen ?? false
  }

  const setExpanded = (key: string, value: boolean): void => {
    overrides.set(key, value)
  }

  return {
    isExpanded,
    setExpanded,
    toggle: (key, ctx) => setExpanded(key, !isExpanded(key, ctx)),
    expandAll: (root = '') => setBulk(root, true),
    collapseAll: (root = '') => pauseRetentionFor(() => setBulk(root, false)),
    commitPath: (path: string): void => {
      if (!path) {
        return
      }

      // Open every ancestor and the target itself as overrides, so the expansion
      // outlives `clearScrollTarget` and stays user-collapsible.
      const segments = path.split('.')

      for (let index = 1; index <= segments.length; index++) {
        const prefix = segments.slice(0, index).join('.')
        overrides.set(prefix, true)

        /*
         * Also commit the marked form (`~headers`) of this segment: it is not a
         * literal prefix of the anchor, so it would re-collapse, and unmount the
         * landed-on row, once the scroll target cleared. Derived rather than
         * registered, because operations mount lazily and would register too
         * late. An override for a key nothing uses is inert.
         */
        const cut = prefix.lastIndexOf('.')

        if (cut !== -1) {
          overrides.set(`${prefix.slice(0, cut)}.~${prefix.slice(cut + 1)}`, true)
        }
      }
    },
    baseline,
    pauseRetentionFor,
    untilFound: (() => {
      let used = 0

      return {
        acquire: (): boolean => {
          if (retentionPaused || used >= UNTIL_FOUND_CAP) {
            return false
          }

          used += 1
          return true
        },
        release: (): void => {
          used = Math.max(0, used - 1)
        },
      }
    })(),
  }
}

/**
 * Carries the expansion store down to every row of one schema tree. The store
 * is provided rather than kept in module scope so two `<ApiReference>` roots on
 * the same page each get their own expansion state, and so a Schema mounted on
 * its own (a test or a story) can fall back to providing one for its subtree.
 */
export const SCHEMA_EXPANSION_SYMBOL: InjectionKey<SchemaExpansionStore> = Symbol('schema-expansion')

/**
 * Marks that an enclosing Schema already owns the tree root. Nesting depth
 * cannot identify the outermost tree, because a nested Schema may mount at depth
 * 0 (an `allOf` member, or a caller that omits `depth`), and the root-only
 * features (sticky ancestor strip, keyboard navigation) must not install twice.
 */
export const SCHEMA_TREE_ROOT_SYMBOL: InjectionKey<boolean> = Symbol('schema-tree-root')

/**
 * Create the expansion store for one `<ApiReference>` and wire up deep links.
 * The scroll target is read only after mount: it comes from a URL fragment the
 * server never sees, so committing it during SSR would make every ancestor
 * panel on a deep-linked path a hydration mismatch.
 */
export const provideSchemaExpansion = (): SchemaExpansionStore => {
  const store = createSchemaExpansionStore()
  provide(SCHEMA_EXPANSION_SYMBOL, store)

  onMounted(() => {
    watch(
      scrollTargetId,
      (target) => {
        if (target) {
          store.commitPath(target)
        }
      },
      { immediate: true },
    )

    /** Print with everything expanded, then put the reader's state back. */
    let baselineBeforePrint: ExpansionBaseline | null = null

    const handleBeforePrint = (): void => {
      baselineBeforePrint = store.baseline.value
      store.baseline.value = 'expanded'
    }

    const handleAfterPrint = (): void => {
      if (baselineBeforePrint !== null) {
        // Restoring the baseline closes every row the print flip opened; none may claim a slot.
        const previous = baselineBeforePrint
        store.pauseRetentionFor(() => {
          store.baseline.value = previous
        })
        baselineBeforePrint = null
      }
    }

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    onBeforeUnmount(() => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    })
  })

  return store
}

/**
 * Get the expansion store for this schema tree. One store per `<ApiReference>`,
 * never module-global: `createApiReference` can run twice on one page and the
 * two must not share expansion. When nothing above has provided one (a Schema
 * mounted alone in a test or story), the first node to ask creates and provides
 * it, so its descendants still share one.
 */
export const useSchemaExpansion = (): SchemaExpansionStore => {
  const provided = inject(SCHEMA_EXPANSION_SYMBOL, null)

  if (provided) {
    return provided
  }

  const fallback = createSchemaExpansionStore()
  provide(SCHEMA_EXPANSION_SYMBOL, fallback)

  return fallback
}
