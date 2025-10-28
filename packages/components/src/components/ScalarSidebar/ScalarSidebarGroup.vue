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
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarSidebarButton from './ScalarSidebarButton.vue'
import ScalarSidebarGroupToggle from './ScalarSidebarGroupToggle.vue'
import ScalarSidebarIndent from './ScalarSidebarIndent.vue'
import { type SidebarGroupLevel, useSidebarGroups } from './useSidebarGroups'

const { is = 'ul' } = defineProps<
  ScalarSidebarItemProps & { modelValue: boolean }
>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

defineSlots<{
  /** The text content of the toggle */
  default?(props: { open: boolean }): unknown
  /** Override the entire toggle button */
  button?(props: { open: boolean; level: SidebarGroupLevel }): unknown
  /** The list of sidebar subitems */
  items?(props: { open: boolean }): unknown
  /** Icon for the sidebar group */
  icon?(props: { open: boolean }): unknown
}>()

const { level } = useSidebarGroups({ increment: true })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <li class="group/item contents">
    <slot
      :level="level"
      name="button"
      :open="!!modelValue">
      <ScalarSidebarButton
        is="button"
        :active
        :aria-expanded="modelValue"
        class="group/group-button"
        :disabled
        :indent="level"
        :selected
        @click="() => emit('update:modelValue', !modelValue)">
        <template #indent>
          <ScalarSidebarIndent
            class="mr-0"
            :indent="level" />
        </template>
        <template #icon>
          <slot
            name="icon"
            :open="modelValue">
            <ScalarSidebarGroupToggle
              class="text-c-3"
              :open="modelValue" />
          </slot>
        </template>
        <slot :open="!!modelValue" />
      </ScalarSidebarButton>
    </slot>
    <component
      :is="is"
      v-if="modelValue"
      v-bind="cx('group/items flex flex-col gap-px')">
      <slot
        name="items"
        :open="!!modelValue" />
    </component>
  </li>
</template>
