<script setup lang="ts">
import SettingsOption from './SettingsOption.vue'

type ColorMode = 'system' | 'light' | 'dark'

const { colorMode } = defineProps<{
  /** Currently active color mode */
  colorMode: ColorMode
}>()

const emit = defineEmits<{
  (e: 'update:colorMode', value: ColorMode): void
}>()

const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: 'system', label: 'System Preference (default)' },
  { value: 'light', label: 'Light Mode Always' },
  { value: 'dark', label: 'Dark Mode Always' },
]
</script>
<template>
  <div class="flex flex-col gap-2">
    <SettingsOption
      v-for="mode in COLOR_MODES"
      :key="mode.value"
      :selected="colorMode === mode.value"
      @click="emit('update:colorMode', mode.value)">
      {{ mode.label }}
    </SettingsOption>
  </div>
</template>
