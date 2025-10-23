<script setup lang="ts">
import {
  ScalarDropdownButton,
  ScalarDropdownMenu,
} from '@/components/ScalarDropdown'
import {
  ScalarListboxCheckbox,
  type ScalarListboxOption,
} from '@/components/ScalarListbox'
import {
  ScalarIconCaretRight,
  ScalarIconPlus,
  ScalarIconSwap,
} from '@scalar/icons'
import { DropdownMenu } from 'radix-vue/namespaced'

import ScalarMenuLink from './ScalarMenuLink.vue'

const { workspaceOptions } = defineProps<{
  /** The list of workspaces to choose from */
  workspaceOptions: ScalarListboxOption[]
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
          <DropdownMenu.RadioItem
            v-for="w in workspaceOptions"
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
