<script setup lang="ts">
import {
  ScalarIconCaretRight,
  ScalarIconPlus,
  ScalarIconSwap,
} from '@scalar/icons'
import { DropdownMenu } from 'radix-vue/namespaced'

import { ScalarDropdownButton, ScalarDropdownMenu } from '../ScalarDropdown'
import {
  ScalarListboxCheckbox,
  type ScalarListboxOption,
} from '../ScalarListbox'
import ScalarMenuLink from './ScalarMenuLink.vue'

export type WorkspaceGroup = {
  /** Label for the group */
  label?: string
  /** Options within the group */
  options: ScalarListboxOption[]
}

const { workspaceOptions } = defineProps<{
  /** The list of workspaces to choose from */
  workspaceOptions: WorkspaceGroup[]
}>()

const emit = defineEmits<{
  /** Create a new workspace */
  (e: 'createWorkspace'): void
}>()

const model = defineModel<string | undefined>()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <DropdownMenu.Sub>
    <ScalarMenuLink
      :is="DropdownMenu.SubTrigger"
      :icon="ScalarIconSwap"
      v-bind="$attrs">
      <div>Change workspace</div>
      <ScalarIconCaretRight
        class="ml-auto text-c-2 -mr-0.25 size-3"
        weight="bold" />
    </ScalarMenuLink>

    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        :as="ScalarDropdownMenu"
        class="max-h-radix-popper z-context-plus"
        :sideOffset="3">
        <DropdownMenu.RadioGroup
          v-model="model"
          class="contents">
          <template
            v-for="(group, groupIndex) in workspaceOptions"
            :key="groupIndex">
            <!-- Group label (only shown if there's a label) -->
            <DropdownMenu.Label
              v-if="group.label"
              class="px-3 py-1.5 text-xs font-medium text-c-3 select-none">
              {{ group.label }}
            </DropdownMenu.Label>

            <!-- Group items -->
            <DropdownMenu.RadioItem
              v-for="w in group.options"
              :key="w.id"
              :as="ScalarDropdownButton"
              class="group/item flex items-center"
              :value="w.id">
              <div class="flex h-full items-center gap-1 flex-1 truncate">
                {{ w.label }}
              </div>
              <ScalarListboxCheckbox
                class="ml-auto"
                :selected="w.id === model" />
            </DropdownMenu.RadioItem>

            <!-- Group separator (only between groups, not after the last one) -->
            <DropdownMenu.Separator
              v-if="groupIndex < workspaceOptions.length - 1"
              class="h-px bg-b-3 my-1.5" />
          </template>
        </DropdownMenu.RadioGroup>

        <DropdownMenu.Item
          :as="ScalarDropdownButton"
          class="flex items-center"
          @click="emit('createWorkspace')">
          <ScalarIconPlus
            class="bg-b-3 -ml-0.75 rounded p-1 size-5 text-c-3"
            weight="bold" />
          Create workspace
        </DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Portal>
  </DropdownMenu.Sub>
</template>
