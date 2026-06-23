<script lang="ts" setup>
import {
  ScalarCheckboxRadioGroup,
  type ScalarCheckboxOption,
} from '@scalar/components/checkbox-input'
import { computed } from 'vue'

import { useApiReferenceI18n } from '@/features/i18n'

const model = defineModel<'modern' | 'classic'>()
const { translate } = useApiReferenceI18n()

const options = computed<ScalarCheckboxOption[]>(() => [
  { label: translate('developerTools.layoutModern'), value: 'modern' },
  { label: translate('developerTools.layoutClassic'), value: 'classic' },
])

const selected = computed<ScalarCheckboxOption>({
  get: () =>
    options.value.find((option) => option.value === model.value) ??
    options.value[0]!,
  set: (option) => (model.value = option.value as 'modern' | 'classic'),
})
</script>
<template>
  <ScalarCheckboxRadioGroup
    v-model="selected"
    :options />
</template>
