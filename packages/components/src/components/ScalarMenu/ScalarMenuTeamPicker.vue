<script setup lang="ts">
import {
  ScalarIconCaretRight,
  ScalarIconPlus,
  ScalarIconUserSwitch,
} from '@scalar/icons'
import { DropdownMenu } from 'radix-vue/namespaced'
import { computed } from 'vue'

import {
  ScalarDropdownButton,
  ScalarDropdownMenu,
  ScalarListboxCheckbox,
} from '../..'
import { ScalarMenuLink, type ScalarMenuTeamOption } from './'
import ScalarMenuTeamProfile from './ScalarMenuTeamProfile.vue'

const props = defineProps<{
  /** The currently selected team */
  team?: ScalarMenuTeamOption | undefined
  /** The list of teams to choose from */
  teams: ScalarMenuTeamOption[]
}>()

const emit = defineEmits<{
  /** Emitted when the selected team changes */
  (e: 'update:team', value: ScalarMenuTeamOption | undefined): void
  /** Emitted when the user clicks the "Create new team" button */
  (e: 'add'): void
}>()

/** A model that tracks the team id */
const model = computed<string | undefined>({
  get: () => props.team?.id,
  set: (v) =>
    emit(
      'update:team',
      props.teams.find((t) => t.id === v),
    ),
})

defineOptions({ inheritAttrs: false })
</script>
<template>
  <DropdownMenu.Sub>
    <ScalarMenuLink
      :is="DropdownMenu.SubTrigger"
      :icon="ScalarIconUserSwitch"
      v-bind="$attrs">
      <div>Change team</div>
      <ScalarIconCaretRight
        class="text-c-2 -mr-0.25 ml-auto size-3"
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
            v-for="t in teams"
            :key="t.id"
            :as="ScalarDropdownButton"
            class="group/item flex items-center"
            :value="t.id">
            <ScalarMenuTeamProfile
              class="-ml-0.75 min-w-0 flex-1"
              :label="t.label"
              :src="t.src" />
            <ScalarListboxCheckbox
              class="ml-auto"
              :selected="t.id === model" />
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
        <DropdownMenu.Item
          :as="ScalarDropdownButton"
          class="flex items-center"
          @click="emit('add')">
          <ScalarIconPlus
            class="bg-b-3 text-c-3 -ml-0.75 size-5 rounded p-1"
            weight="bold" />
          Create new team
        </DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Portal>
  </DropdownMenu.Sub>
</template>
