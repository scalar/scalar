import Fuse from 'fuse.js'
import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue'

/**
 * Minimum shape a filterable item needs. Anything we run through this hook
 * must have at least a `title`, which is the only field the fuzzy index
 * looks at. Extra fields on `T` are preserved verbatim in the filtered list.
 */
type FilterableItem = {
  title: string
}

/**
 * Reactive filter state for a list of sidebar documents.
 *
 * Extracts the "jump to document by name" affordance used by the top-level
 * sidebar view into a stand-alone, testable primitive. Callers provide a
 * reactive source of items (ref, computed, or getter) and receive:
 *
 *  - `isVisible`: whether the filter input is currently revealed
 *  - `query`: v-model target for the search input
 *  - `filteredItems`: the input list narrowed down by the current query
 *  - `toggle()`: flips `isVisible`; clears the query when hiding so the list
 *    is not left in a filtered state after the input disappears
 *  - `reset()`: force-hides the filter and clears the query, e.g. when the
 *    user drills into a document and the top-level filter no longer applies
 *
 * The Fuse index is rebuilt whenever the input list changes so newly added
 * or removed entries are reflected immediately. We deliberately index only
 * the `title` because this is a lightweight UI-level filter, not a content
 * search.
 */
export const useDocumentFilter = <T extends FilterableItem>(items: MaybeRefOrGetter<T[]>) => {
  const isVisible = ref(false)
  const query = ref('')

  const fuse = computed(
    () =>
      new Fuse(toValue(items), {
        keys: ['title'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
  )

  const filteredItems = computed<T[]>(() => {
    const trimmed = query.value.trim()
    if (!trimmed) {
      return toValue(items)
    }

    return fuse.value.search(trimmed).map((result) => result.item)
  })

  /**
   * Flip the filter input's visibility. Hiding the input also clears the
   * current query so the list does not stay filtered after the input
   * disappears (which would otherwise leave documents invisible with no way
   * for the user to see why).
   */
  const toggle = () => {
    isVisible.value = !isVisible.value
    if (!isVisible.value) {
      query.value = ''
    }
  }

  /** Hide the input and clear the query. */
  const reset = () => {
    isVisible.value = false
    query.value = ''
  }

  return { isVisible, query, filteredItems, toggle, reset }
}
