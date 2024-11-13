<script setup lang="ts">
import { computed } from 'vue'

import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '../../'

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
</script>
<template>
  <div class="flex flex-col *:contents *:w-full">
    <ScalarListbox
      v-model="model"
      :options="teams"
      placement="bottom-end"
      resize>
      <ScalarButton
        class="h-auto px-2.5 py-1 text-xs shadow-none"
        variant="outlined">
        {{ team?.label }}
        <ScalarIcon
          class="ml-auto text-c-2"
          icon="ChevronDown"
          size="xs"
          thickness="2.5" />
      </ScalarButton>
    </ScalarListbox>
  </div>
</template>
