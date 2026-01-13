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
import { ScalarIconArrowRight, ScalarIconCaretLeft } from '@scalar/icons'
import { nextTick, ref, useTemplateRef } from 'vue'

import { ScalarIconLegacyAdapter } from '../ScalarIcon'
import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarItems from './ScalarSidebarItems.vue'
import ScalarSidebarSpacer from './ScalarSidebarSpacer.vue'
import { findScrollContainer } from './findScrollContainer'
import type { ScalarSidebarGroupProps } from './types'
import { useSidebarGroups } from './useSidebarGroups'
import { useSidebarNestedItem } from './useSidebarNestedItems'

const { controlled } = defineProps<ScalarSidebarGroupProps>()

const emit = defineEmits<{
  /** Emitted when the nested item button is clicked */
  (e: 'click', event: MouseEvent): void
  /** Emitted when the back button is clicked */
  (e: 'back', event: MouseEvent): void
}>()

const open = defineModel<boolean>('open', { default: false })
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

/** Handle the click event for the nested items button */
const handleClick = (event: MouseEvent) => {
  // Bubble up the click event
  emit('click', event)
  if (!controlled) {
    // Only toggle the open state if the group is uncontrolled
    open.value = true
  }
}

/** Handle the back button click event */
const handleBack = (event: MouseEvent) => {
  // Bubble up the back event
  emit('back', event)
  if (!controlled) {
    // Only toggle the open state if the group is uncontrolled
    open.value = false
  }
}
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
        :aria-expanded="open"
        :disabled
        :indent="level"
        :selected
        v-bind="$attrs"
        @click="handleClick">
        <template
          v-if="icon || $slots.icon"
          #icon>
          <slot name="icon">
            <ScalarIconLegacyAdapter
              v-if="icon"
              :icon
              weight="bold" />
          </slot>
        </template>
        <slot />
        <template #aside>
          <slot name="aside">
            <ScalarIconArrowRight class="size-4 text-sidebar-c-2" />
          </slot>
        </template>
      </ScalarSidebarButton>
    </slot>
    <!-- Make sure the div is around for the entire transition -->
    <Transition
      :duration="300"
      enterActiveClass="top-(--nested-items-offset)"
      leaveActiveClass="top-(--nested-items-offset)"
      @enter="onOpen"
      @leave="onClose">
      <div
        v-if="open"
        class="absolute inset-0 translate-x-full">
        <ScalarSidebarItems v-bind="$attrs">
          <slot name="back">
            <ScalarSidebarButton
              is="button"
              class="text-sidebar-c-1 font-sidebar-active hover:text-sidebar-c-1"
              @click="handleBack">
              <template #icon>
                <ScalarIconCaretLeft class="size-4 -m-px text-sidebar-c-2" />
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
