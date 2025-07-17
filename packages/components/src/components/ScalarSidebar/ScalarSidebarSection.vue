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

const { is = 'ul' } = defineProps<ScalarSidebarItemProps>()

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
  <li class="group/item group/sidebar-section contents">
    <ScalarSidebarSpacer
      class="group/spacer-before h-3"
      :indent="level" />
    <ScalarSidebarButton
      is="div"
      class="text-sm font-bold"
      :indent="level"
      :icon="icon"
      disabled>
      <slot />
    </ScalarSidebarButton>
    <component
      :is="is"
      v-bind="cx('flex flex-col gap-px')">
      <slot name="items" />
    </component>
    <ScalarSidebarSpacer
      class="group/spacer-after h-3"
      :indent="level" />
  </li>
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
