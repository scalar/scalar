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
import { nextTick, ref, useTemplateRef } from 'vue'

import { ScalarIconLegacyAdapter } from '../ScalarIcon'
import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'
import ScalarSidebarSpacer from './ScalarSidebarSpacer.vue'
import { findScrollContainer } from './findScrollContainer'
import type { ScalarSidebarItemProps } from './types'
import { useSidebarGroups } from './useSidebarGroups'
import { useSidebarNestedItem } from './useSidebarNestedItems'

const { icon = ScalarIconListDashes } = defineProps<ScalarSidebarItemProps>()

const open = defineModel<boolean>({ default: false })
useSidebarNestedItem(open)

defineSlots<{
  /** The text content of the button */
  'default'?: () => unknown
  /** Override the entire button */
  'button'?: () => unknown
  /** Override the icon */
  'icon'?: () => unknown
  /** Override the aside slot */
  'aside'?: () => unknown
  /** Override the back button */
  'back'?: () => unknown
  /** Override the back button label */
  'back-label'?: () => unknown
  /** The list of sidebar subitems */
  'items'?: () => unknown
}>()

const { level } = useSidebarGroups({ reset: true })

/** The root element ref */
const el = useTemplateRef('el')

/** How far down to offset the nested items by when animating them in */
const offset = ref(0)

// Transition hooks

function onOpen() {
  // Calculate how far down the nearest scroll container is scrolled
  // We offset the nested items by this amount when animating them
  // in so they appear in line with the parent items list.
  offset.value = findScrollContainer(el.value).scrollTop ?? 0

  // Focus the first button in the nested items
  nextTick(() =>
    el.value
      ?.querySelector<HTMLButtonElement>('button:not([aria-expanded="true"])')
      ?.focus({ preventScroll: true }),
  )
}
function onClose() {
  nextTick(() => {
    el.value?.querySelector('button')?.focus({ preventScroll: true })
    findScrollContainer(el.value).scrollTop = offset.value
  })
}

defineOptions({ inheritAttrs: false })
</script>
<template>
  <li
    ref="el"
    class="group/item group/nested-items contents"
    :class="{ 'group/nested-items-open': open }"
    :style="{ '--nested-items-offset': `${offset}px` }">
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
          <slot name="aside">
            <ScalarIconArrowRight class="size-4 text-c-2" />
          </slot>
        </template>
      </ScalarSidebarButton>
    </slot>
    <!-- Make sure the div is around for the entire transition -->
    <Transition
      @enter="onOpen"
      @leave="onClose"
      enter-active-class="top-(--nested-items-offset)"
      leave-active-class="top-(--nested-items-offset)"
      :duration="300">
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
              <slot name="back-label">Back</slot>
            </ScalarSidebarButton>
          </slot>
          <ScalarSidebarSpacer class="h-3" />
          <slot name="items" />
        </ScalarSidebarItems>
      </div>
    </Transition>
  </li>
</template>
