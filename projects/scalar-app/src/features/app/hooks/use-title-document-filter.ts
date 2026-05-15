import Fuse from 'fuse.js'
import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue'

/**
 * Minimum shape a filterable item needs. Anything we run through this hook
 * must have at least a `title`, which is the only field the fuzzy index
 * looks at. Extra fields on `T` are preserved verbatim in the filtered list.
 */
type TitleFilterableItem = {
  title: string
}

/**
 * Reactive fuzzy title filter for document-like lists.
 *
 * Extracts the "jump to document by name" affordance into a stand-alone,
 * testable primitive. Callers provide a reactive source of items (ref,
 * computed, or getter) and receive visibility, query, filtered items, and
 * toggle/reset controls.
 *
 * The Fuse index is rebuilt whenever the input list changes. Only `title`
 * is indexed because this is a lightweight UI filter, not a content search.
 */
export const useTitleDocumentFilter = <T extends TitleFilterableItem>(items: MaybeRefOrGetter<T[]>) => {
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

  const toggle = () => {
    isVisible.value = !isVisible.value
    if (!isVisible.value) {
      query.value = ''
    }
  }

  const reset = () => {
    isVisible.value = false
    query.value = ''
  }

  return { isVisible, query, filteredItems, toggle, reset }
}
