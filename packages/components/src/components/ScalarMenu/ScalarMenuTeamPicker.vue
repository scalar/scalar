<script setup lang="ts">
import { computed } from 'vue'

import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '../..'
import { useBindCx } from '../../hooks/useBindCx'

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
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex flex-col pb-px')">
    <ScalarListbox
      v-model="model"
      :options="teams"
      placement="bottom-end"
      resize>
      <ScalarButton
        class="h-auto px-2.5 py-1 text-xs leading shadow-none"
        variant="outlined">
        <div class="truncate">{{ team?.label }}</div>
        <ScalarIcon
          class="ml-auto text-c-2"
          icon="ChevronDown"
          size="sm" />
      </ScalarButton>
    </ScalarListbox>
  </div>
</template>
