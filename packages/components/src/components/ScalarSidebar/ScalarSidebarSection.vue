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
import ScalarSidebarGroupToggle from './ScalarSidebarGroupToggle.vue'
import ScalarSidebarSpacer from './ScalarSidebarSpacer.vue'
import type { ScalarSidebarSectionProps } from './types'
import { useSidebarGroups } from './useSidebarGroups'

const { is = 'li', collapsible = false } =
  defineProps<ScalarSidebarSectionProps>()

const emit = defineEmits<{
  /** Emitted when the section header is toggled (only when collapsible) */
  (e: 'toggle', event: MouseEvent): void
}>()

const open = defineModel<boolean>('open', { default: true })

defineSlots<{
  /** The text content of the toggle */
  default?(props: { open: boolean }): unknown
  /** The list of sidebar subitems */
  items?(props: { open: boolean }): unknown
}>()

// When collapsible, nest child items by incrementing the group level so tag
// groups render with visible hierarchy. Non-collapsible sections stay flat.
const { level } = useSidebarGroups({ increment: collapsible })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

/** Handle the click on the section header. No-op when not collapsible. */
const handleClick = (event: MouseEvent) => {
  if (!collapsible) {
    return
  }
  emit('toggle', event)
  open.value = !open.value
}
</script>
<template>
  <component
    :is="is"
    v-bind="cx('group/item group/sidebar-section contents')">
    <ScalarSidebarSpacer
      class="group/spacer-before h-3"
      :indent="level" />
    <ScalarSidebarButton
      :is="collapsible ? 'button' : 'div'"
      :aria-expanded="collapsible ? open : undefined"
      class="text-sm/4 py-1.75 font-bold"
      :disabled="!collapsible"
      :icon="icon"
      :indent="level"
      @click="handleClick">
      <slot :open="open" />
      <template
        v-if="collapsible"
        #aside>
        <ScalarSidebarGroupToggle
          class="text-sidebar-c-2"
          :open="open" />
      </template>
    </ScalarSidebarButton>
    <ul
      v-show="!collapsible || open"
      class="flex flex-col gap-px">
      <slot
        name="items"
        :open="open" />
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
