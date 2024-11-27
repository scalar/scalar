import type { CXOptions } from 'cva'
import { computed, useAttrs } from 'vue'

import { cx } from '../cva'

/**
 * Provides a wrapper around the `cx` function that merges the
 * component's class attribute with the provided classes and binds the
 * remaining attributes
 *
 * @see https://beta.cva.style/api-reference#cx
 *
 * @example
 * <script setup>
 * import { useBindCx, cva } from '@scalar/components'
 *
 * defineProps<{ active?: boolean }>()
 *
 * // Important: disable inheritance of attributes
 * defineOptions({ inheritAttrs: false })
 *
 * const { cx } = useBindCx()
 *
 * const variants = cva({
 *   base: 'border rounded p-2 bg-b-1',
 *   variants: { active: { true: 'bg-b-2' } },
 * })
 * </script>
 * <template>
 *   <div v-bind="cx(variants({ active }))">MockComponent</div>
 * </template>
 */
export function useBindCx() {
  const attrs = computed(() => {
    const { class: className, ...rest } = useAttrs()
    return { class: className || '', rest }
  })

  function bindCx(...args: CXOptions): {
    /** The merged class attribute */
    class: string
    /** The remaining attributes */
    [key: string]: any
  } {
    return {
      class: cx(...args, attrs.value.class),
      ...attrs.value.rest,
    }
  }

  return {
    /**
     * Provides a wrapper around the `cx` function that merges the
     * component's class attribute with the provided classes and binds the
     * remaining attributes
     *
     * @example
     * <script setup>
     * ...
     * const { cx } = useBindCx()
     * </script>
     * <template>
     *   <div v-bind="cx(...)">...</div>
     * </template>
     */
    cx: bindCx,
  }
}
