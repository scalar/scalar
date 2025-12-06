<script lang="ts">
/**
 * Scalar Sidebar Group component
 *
 * A collapsible ScalarSidebarItem that can contain subitems.
 *
 * Classes applied to the component are passed to the inner list element.
 * Other attributes (like click event) are passed to the toggle button.
 *
 * @example
 * <ScalarSidebarGroup>
 *   <!-- Group toggle text -->
 *   <template #items>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *     <ScalarSidebarItem>...</ScalarSidebarItem>
 *   </template>
 * </ScalarSidebarGroup>
 *
 *
 * By default the component has it's own internal open state, but this can be
 * controlled by passing the `controlled` prop and using binding the :open prop.
 *
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarGroupToggle from './ScalarSidebarGroupToggle.vue'
import ScalarSidebarIndent from './ScalarSidebarIndent.vue'
import type { ScalarSidebarGroupProps, ScalarSidebarGroupSlots } from './types'
import { useSidebarGroups } from './useSidebarGroups'

const { controlled, is = 'li' } = defineProps<ScalarSidebarGroupProps>()

const emit = defineEmits<{
  /** Emitted when the group toggle button is clicked */
  (e: 'click', event: MouseEvent): void
}>()

const open = defineModel<boolean>('open', { default: false })

defineSlots<ScalarSidebarGroupSlots>()

const { level } = useSidebarGroups({ increment: true })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

/** Handle the click event for the group toggle */
const handleClick = (event: MouseEvent) => {
  // Bubble up the click event
  emit('click', event)
  if (!controlled) {
    // Only toggle the open state if the group is uncontrolled
    open.value = !open.value
  }
}
</script>
<template>
  <component
    v-bind="cx('group/item flex flex-col gap-px')"
    :is="is">
    <slot
      name="before"
      :open />
    <slot
      :level="level"
      name="button"
      :open>
      <ScalarSidebarButton
        is="button"
        :active
        :aria-expanded="open"
        class="group/group-button"
        :disabled
        :indent="level"
        :selected
        @click="handleClick">
        <template #indent>
          <ScalarSidebarIndent
            class="mr-0 -my-2"
            :indent="level" />
        </template>
        <template #icon>
          <slot
            name="icon"
            :open>
            <ScalarSidebarGroupToggle
              class="text-c-3"
              :open />
          </slot>
        </template>
        <template
          v-if="$slots.aside"
          #aside>
          <slot
            name="aside"
            :open />
        </template>
        <slot :open />
      </ScalarSidebarButton>
    </slot>
    <slot
      name="after"
      :open />
    <ul
      v-if="open"
      class="group/items flex flex-col gap-px">
      <slot
        name="items"
        :open />
    </ul>
  </component>
</template>
