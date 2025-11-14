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

const { is = 'li', controlled } = defineProps<ScalarSidebarGroupProps>()

defineEmits<{
  /** Emitted when the group toggle button is clicked */
  (e: 'click', event: MouseEvent): void
}>()

const model = defineModel<boolean>('open', { default: false })

defineSlots<ScalarSidebarGroupSlots>()

const { level } = useSidebarGroups({ increment: true })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    v-bind="cx('group/item flex flex-col gap-px')"
    :is="is">
    <slot
      :level="level"
      name="button"
      :open="model">
      <ScalarSidebarButton
        is="button"
        :active
        :aria-expanded="model"
        class="group/group-button"
        :disabled
        :indent="level"
        :selected
        @click="($emit('click', $event), !controlled && (model = !model))">
        <template #indent>
          <ScalarSidebarIndent
            class="mr-0"
            :indent="level" />
        </template>
        <template #icon>
          <slot
            name="icon"
            :open="model">
            <ScalarSidebarGroupToggle
              class="text-c-3"
              :open="model" />
          </slot>
        </template>
        <template
          v-if="$slots.aside"
          #aside>
          <slot
            name="aside"
            :open="model" />
        </template>
        <slot :open="model" />
      </ScalarSidebarButton>
    </slot>
    <ul
      v-if="model"
      class="group/items flex flex-col gap-px">
      <slot
        name="items"
        :open="model" />
    </ul>
  </component>
</template>
