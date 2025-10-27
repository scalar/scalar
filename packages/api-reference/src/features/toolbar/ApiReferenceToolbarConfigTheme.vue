<script lang="ts" setup>
import { ScalarCombobox, ScalarListboxInput } from '@scalar/components'
import { themeIds, themeLabels, type ThemeId } from '@scalar/themes'
import { computed } from 'vue'

type ThemeOption = {
  id: ThemeId
  label: (typeof themeLabels)[ThemeId]
}

const model = defineModel<ThemeId>()

const options = computed<ThemeOption[]>(() =>
  themeIds.map((id) => ({ id, label: themeLabels[id] })),
)
const selected = computed<ThemeOption>({
  get: () => {
    const theme = model.value ?? 'default'
    return (
      options.value.find((o) => o.id === theme) ??
      (options.value[0] as ThemeOption)
    )
  },
  set: (option) => (model.value = option.id),
})
</script>
<template>
  <ScalarCombobox
    v-slot="{ open }"
    v-model="selected"
    :options
    resize>
    <ScalarListboxInput :open>
      {{ selected.label }}
    </ScalarListboxInput>
  </ScalarCombobox>
</template>
