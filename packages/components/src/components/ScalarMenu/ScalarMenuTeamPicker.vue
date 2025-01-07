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
import { ScalarMenuLink } from './'

const props = defineProps<{
  team?: ScalarListboxOption | undefined
  teams: ScalarListboxOption[]
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
      v-bind="$attrs">
      <div>Change team</div>
      <ScalarIcon
        class="ml-auto text-c-2"
        icon="ChevronRight"
        size="sm" />
    </ScalarMenuLink>
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent>
        <ScalarDropdownMenu>
          <ScalarDropdownButton
            v-for="t in teams"
            :key="t.id"
            class="group/item"
            @click="model = t">
            <ScalarListboxCheckbox :selected="t.id === model?.id" />
            {{ t.label }}
          </ScalarDropdownButton>
        </ScalarDropdownMenu>
      </DropdownMenu.SubContent>
    </DropdownMenu.Portal>
  </DropdownMenu.Sub>
</template>
