<script lang="ts">
/**
 * Scalar Sidebar Nested Items component
 *
 * A provides list of items thats presented over the parent list
 * Needs to be nested inside a ScalarSidebarItems component
 *
 * @example
 * <ScalarSidebarNestedItems v-model="open">
 *   <!-- Item text -->
 *   <template #items>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *   </template>
 * </ScalarSidebarNestedItems>
 */
export default {}
</script>
<script setup lang="ts">
import {
  ScalarIconArrowRight,
  ScalarIconCaretLeft,
  ScalarIconListDashes,
} from '@scalar/icons'

import { ScalarIconLegacyAdapter } from '../ScalarIcon'
import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'
import ScalarSidebarSpacer from './ScalarSidebarSpacer.vue'
import type { ScalarSidebarItemProps } from './types'
import { useSidebarGroups } from './useSidebarGroups'
import { useSidebarNestedItem } from './useSidebarNestedItems'

const { icon = ScalarIconListDashes } = defineProps<ScalarSidebarItemProps>()

const open = defineModel<boolean>({ default: false })
useSidebarNestedItem(open)

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
    <!-- Make sure the div is around for the entire transition -->
    <Transition :duration="300">
      <div
        v-if="open"
        class="absolute inset-0 translate-x-full">
        <ScalarSidebarItems v-bind="$attrs">
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
          <slot name="items" />
        </ScalarSidebarItems>
      </div>
    </Transition>
  </li>
</template>
