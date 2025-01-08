<script setup lang="ts">
import { DropdownMenu } from 'radix-vue/namespaced'
import { computed } from 'vue'

import {
  ScalarDropdownButton,
  ScalarDropdownMenu,
  ScalarIcon,
  ScalarListboxCheckbox,
  type ScalarListboxOption,
} from '../..'
import { ScalarMenuLink, type ScalarMenuTeamOption } from './'
import ScalarMenuTeamProfile from './ScalarMenuTeamProfile.vue'

const props = defineProps<{
  team?: ScalarMenuTeamOption | undefined
  teams: ScalarMenuTeamOption[]
}>()

const emit = defineEmits<{
  (e: 'update:team', value: ScalarListboxOption | undefined): void
}>()

const model = computed<ScalarListboxOption | undefined>({
  get: () => props.team,
  set: (v) => emit('update:team', v),
})

defineOptions({ inheritAttrs: false })
</script>
<template>
  <DropdownMenu.Sub>
    <ScalarMenuLink
      :is="DropdownMenu.SubTrigger"
      icon="UserSwitch"
      v-bind="$attrs">
      <div>Change team</div>
      <ScalarIcon
        class="ml-auto text-c-2 -mr-0.25"
        icon="ChevronRight"
        size="sm" />
    </ScalarMenuLink>
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        :as="ScalarDropdownMenu"
        class="max-h-radix-popper"
        :sideOffset="3">
        <ScalarDropdownButton
          v-for="t in teams"
          :key="t.id"
          class="group/item"
          @click="model = t">
          <ScalarMenuTeamProfile
            class="-ml-0.75 flex-1 min-w-0"
            :label="t.label"
            :src="t.src" />
          <ScalarListboxCheckbox
            class="ml-auto"
            :selected="t.id === model?.id" />
        </ScalarDropdownButton>
      </DropdownMenu.SubContent>
    </DropdownMenu.Portal>
  </DropdownMenu.Sub>
</template>
