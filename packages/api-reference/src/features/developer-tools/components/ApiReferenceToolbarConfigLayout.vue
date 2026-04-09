<script lang="ts" setup>
import {
  ScalarCheckboxRadioGroup,
  type ScalarCheckboxOption,
} from '@scalar/components'
import { computed } from 'vue'

const ModernOption = { label: 'Modern', value: 'modern' } as const
const ClassicOption = { label: 'Classic', value: 'classic' } as const

const options = [
  ModernOption,
  ClassicOption,
] as const satisfies ScalarCheckboxOption[]

const model = defineModel<'modern' | 'classic'>()

const selected = computed<(typeof options)[number]>({
  get: () => (model.value === 'modern' ? ModernOption : ClassicOption),
  set: (option) => (model.value = option.value),
})
</script>
<template>
  <ScalarCheckboxRadioGroup
    v-model="selected"
    :options />
</template>
