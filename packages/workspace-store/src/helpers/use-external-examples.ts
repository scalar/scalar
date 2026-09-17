import {
  type ComponentPublicInstance,
  type ComputedRef,
  type InjectionKey,
  type Ref,
  computed,
  inject,
  onScopeDispose,
  ref,
  watch,
  watchEffect,
} from 'vue'

import { type ExternalExampleResolver, createExternalExampleResolver } from '@/helpers/external-examples'
import type { ExampleObject } from '@/schemas/v3.2/strict/openapi-document'

/** Supply the current document's resolver so consumers share downloads and invalidation. */
export const EXTERNAL_EXAMPLES: InjectionKey<() => ExternalExampleResolver> = Symbol('external-examples')

/** Observe current visibility, rather than mounting, to avoid fetching every operation on a long page. */
export const useExampleVisibility = (target: Ref<Element | ComponentPublicInstance | null>): Ref<boolean> => {
  const visible = ref(false)
  let observer: IntersectionObserver | undefined
  watch(
    target,
    (element) => {
      observer?.disconnect()
      visible.value = false
      const node = element && ('$el' in element ? element.$el : element)
      if (typeof Element === 'undefined' || !(node instanceof Element)) return
      if (typeof IntersectionObserver === 'undefined') {
        visible.value = true
        return
      }
      observer = new IntersectionObserver(([entry]) => {
        visible.value = entry?.isIntersecting ?? false
      })
      observer.observe(node)
    },
    { flush: 'post' },
  )
  onScopeDispose(() => observer?.disconnect())
  return visible
}

/** Resolve only the selected examples and expose immutable views of their downloaded values. */
export const useExternalExamples = (
  examples: () => (ExampleObject | undefined)[],
  enabled: () => boolean = () => true,
  resolver?: () => ExternalExampleResolver,
): {
  pending: ComputedRef<boolean>
  failed: ComputedRef<boolean>
  resolve: (example: ExampleObject | undefined) => ExampleObject | undefined
  retry: () => Promise<void>
} => {
  const fallback = createExternalExampleResolver()
  const getResolver = resolver ?? inject(EXTERNAL_EXAMPLES, () => fallback)
  const states = computed(() =>
    examples()
      .filter(
        (example): example is ExampleObject =>
          example !== undefined && example.value === undefined && !!example.externalValue,
      )
      .map((example) => getResolver()(example)),
  )

  watchEffect(() => {
    if (!enabled()) return
    for (const state of states.value) {
      if (state.status === 'idle') void state.load()
    }
  })

  return {
    pending: computed(() => states.value.some((state) => state.status !== 'loaded')),
    failed: computed(() => states.value.some((state) => state.status === 'error')),
    resolve: (example) => {
      if (!example || example.value !== undefined || !example.externalValue) return example
      const state = getResolver()(example)
      return state.status === 'loaded' ? { ...example, value: state.value } : example
    },
    retry: async () => {
      await Promise.all(states.value.map((state) => state.load()))
    },
  }
}
