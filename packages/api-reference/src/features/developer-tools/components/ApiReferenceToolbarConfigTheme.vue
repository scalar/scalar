<script lang="ts" setup>
import {
  ScalarCombobox,
  ScalarFormInput,
  ScalarListboxCheckbox,
  ScalarThemeSwatches,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import { presets, themeIds, themeLabels, type ThemeId } from '@scalar/themes'
import { computed } from 'vue'

type ThemeOption = {
  id: Exclude<ThemeId, 'none'>
  label: string
  css: string
}

const model = defineModel<ThemeId>()

const options = computed<ThemeOption[]>(() =>
  themeIds
    .filter((id) => id !== 'none')
    .map((id) => ({
      id,
      label: themeLabels[id],
      css: presets[id].theme,
    })),
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
    v-model="selected"
    :options
    resize>
    <template #default="{ open }">
      <ScalarFormInput>
        <div class="min-w-0 flex-1 truncate text-left">
          {{ selected.label }}
        </div>
        <ScalarThemeSwatches
          class="mr-2"
          :css="selected.css" />
        <ScalarIconCaretDown
          class="size-3.5 transition-transform"
          :class="{ 'rotate-180': open }" />
      </ScalarFormInput>
    </template>
    <template #option="{ selected, option }">
      <ScalarListboxCheckbox :selected />
      <span class="text-c-1 inline-block min-w-0 flex-1 truncate">
        {{ option.label }}
      </span>
      <ScalarThemeSwatches :css="option.css" />
    </template>
  </ScalarCombobox>
</template>
