<script lang="ts">
/**
 * Scalar Search Result List component
 *
 * A container for search result items with a "no results" fallback.
 *
 * @example
 * <ScalarSearchResultList :noResults="results.length === 0">
 *   <ScalarSearchResultItem v-for="r in results" :key="r.id">
 *     {{ r.label }}
 *   </ScalarSearchResultItem>
 * </ScalarSearchResultList>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineProps<{
  noResults?: boolean
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    role="listbox"
    v-bind="cx('flex flex-col')">
    <slot
      v-if="noResults"
      name="noResults">
      <div class="flex flex-col items-center gap-2 px-3 py-4">
        <div
          class="text-base font-medium text-c-2"
          role="alert">
          No results found
        </div>
      </div>
    </slot>
    <slot />
  </div>
</template>
