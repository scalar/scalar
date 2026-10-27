<script lang="ts" setup>
import { ScalarCombobox } from '@scalar/components/combobox'
import { ScalarFormInput } from '@scalar/components/form'
import { ScalarListboxCheckbox } from '@scalar/components/listbox'
import { ScalarThemeSwatches } from '@scalar/components/theme-swatches'
import { ScalarIconCaretDown } from '@scalar/icons'
import { presets, themeIds, themeLabels, type ThemeId } from '@scalar/themes'
import { computed } from 'vue'

type ThemeOption = {
  id: Exclude<ThemeId, 'none'>
  label: string
  css: string
}

const { flat = false } = defineProps<{
  /**
   * The localhost shell's side panel: the chosen theme at full contrast like its other values, and a
   * teleported list, so it opens above the sticky toolbar instead of under it
   */
  flat?: boolean
}>()

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
    resize
    :teleport="flat || undefined">
    <template #default="{ open }">
      <ScalarFormInput>
        <div
          class="min-w-0 flex-1 truncate text-left"
          :class="{ 'text-c-1': flat }">
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
    <template #option="{ selected: isSelected, option }">
      <ScalarListboxCheckbox :selected="isSelected" />
      <span class="text-c-1 inline-block min-w-0 flex-1 truncate">
        {{ option.label }}
      </span>
      <ScalarThemeSwatches :css="option.css" />
    </template>
  </ScalarCombobox>
</template>
