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
import type { ScalarSidebarGroupProps } from './types'
import { type SidebarGroupLevel, useSidebarGroups } from './useSidebarGroups'

const { is = 'ul', controlled } = defineProps<ScalarSidebarGroupProps>()

const model = defineModel<boolean>('open', { default: false })

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
const { stylingAttrsCx, otherAttrs } = useBindCx()
</script>
<template>
  <li class="group/item contents">
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
        v-bind="otherAttrs"
        @click="!controlled && (model = !model)">
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
        <slot :open="model" />
      </ScalarSidebarButton>
    </slot>
    <component
      :is="is"
      v-if="model"
      v-bind="stylingAttrsCx('group/items flex flex-col gap-px')">
      <slot
        name="items"
        :open="model" />
    </component>
  </li>
</template>
