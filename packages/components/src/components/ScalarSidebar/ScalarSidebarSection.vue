<script lang="ts">
/**
 * Scalar Sidebar Section component
 *
 * A section of the sidebar that can contain subitems
 *
 * @example
 * <ScalarSidebarSection>
 *   <!-- Section title -->
 *   <template #title>
 *     My Section
 *   </template>
 *   <!-- Section items -->
 *   <template #items>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *   </template>
 * </ScalarSidebarSection>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarSpacer from './ScalarSidebarSpacer.vue'
import type { ScalarSidebarItemProps } from './types'
import { useSidebarGroups } from './useSidebarGroups'

const { is = 'li' } = defineProps<ScalarSidebarItemProps>()

defineSlots<{
  /** The text content of the toggle */
  default?(): unknown
  /** The list of sidebar subitems */
  items?(): unknown
}>()

const { level } = useSidebarGroups({ increment: false })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    v-bind="cx('group/item group/sidebar-section contents')">
    <ScalarSidebarSpacer
      class="group/spacer-before h-3"
      :indent="level" />
    <ScalarSidebarButton
      is="div"
      class="text-sm/5 py-1.75 font-bold"
      disabled
      :icon="icon"
      :indent="level">
      <slot />
    </ScalarSidebarButton>
    <ul class="flex flex-col gap-px">
      <slot name="items" />
    </ul>
    <ScalarSidebarSpacer
      class="group/spacer-after h-3"
      :indent="level" />
  </component>
</template>
<style>
@reference "../../style.css";

/* Don't add a spacer before the first section */
.group\/sidebar-section:first-of-type > .group\/spacer-before {
  @apply h-0;
}

/* Don't add a spacer after the last section */
.group\/sidebar-section:last-of-type > .group\/spacer-after {
  @apply h-0;
}

/* Only one spacer between sections */
.group\/sidebar-section:has(+ .group\/sidebar-section) > .group\/spacer-after {
  @apply h-0 -mb-px;
}
</style>
