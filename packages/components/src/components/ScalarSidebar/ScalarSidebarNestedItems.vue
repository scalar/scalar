<script lang="ts">
/**
 * Scalar Sidebar Group component
 *
 * A collapsible ScalarSidebarItem that can contain subitems
 *
 * @example
 * <ScalarSidebarGroup v-model="open">
 *   <!-- Group toggle text -->
 *   <template #items>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *   </template>
 * </ScalarSidebarGroup>
 */
export default {}
</script>
<script setup lang="ts">
import type { ScalarSidebarItemProps } from '@/components/ScalarSidebar/types'
import {
  ScalarIconArrowRight,
  ScalarIconCaretLeft,
  ScalarIconListDashes,
} from '@scalar/icons'

import { ScalarIconLegacyAdapter } from '../ScalarIcon'
import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'
import ScalarSidebarSpacer from './ScalarSidebarSpacer.vue'
import { useSidebarGroups } from './useSidebarGroups'

const { icon = ScalarIconListDashes } = defineProps<ScalarSidebarItemProps>()

const open = defineModel<boolean>()

defineSlots<{
  /** The text content of the button */
  default?: () => any
  /** Override the entire button */
  button?: () => any
  /** Override the icon */
  icon?: () => any
  /** Override the back button */
  back?: () => any
  /** The list of sidebar subitems */
  items?: () => any
}>()

const { level } = useSidebarGroups({ reset: true })

defineOptions({ inheritAttrs: false })
</script>
<template>
  <li class="group/item contents">
    <slot name="button">
      <ScalarSidebarButton
        is="button"
        class="text-c-1 font-sidebar-active"
        :aria-expanded="open"
        :indent="level"
        :selected
        :disabled
        @click="open = true">
        <template #icon>
          <slot name="icon">
            <ScalarIconLegacyAdapter
              :icon="icon"
              weight="bold" />
          </slot>
        </template>
        <slot />
        <template #aside>
          <ScalarIconArrowRight class="size-4 text-c-2" />
        </template>
      </ScalarSidebarButton>
    </slot>
    <ScalarSidebarItems
      v-if="open"
      class="absolute inset-0 bg-b-1"
      v-bind="$attrs">
      <slot name="back">
        <ScalarSidebarButton
          is="button"
          @click="open = false"
          class="text-c-1 font-sidebar-active">
          <template #icon>
            <ScalarIconCaretLeft class="size-4 -m-px text-c-2" />
          </template>
          Back
        </ScalarSidebarButton>
      </slot>
      <ScalarSidebarSpacer class="h-3" />
      <slot
        name="items"
        :open="!!open" />
    </ScalarSidebarItems>
  </li>
</template>
