<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { computed, nextTick, ref } from 'vue'

const { activeColor } = defineProps<{
  activeColor: string
}>()

const emit = defineEmits<{
  (e: 'select', color: string): void
}>()

const customColor = ref('')
const customColorInputRef = ref<HTMLInputElement | null>(null)
const showCustomInput = ref(false)
const showSelector = ref(false)

/**
 * Predefined color options available in the color picker.
 * Each option provides a standard color choice for the environment.
 */
const colorOptions = [
  '#FFFFFF',
  '#EF0006',
  '#EDBE20',
  '#069061',
  '#FB892C',
  '#0082D0',
  '#5203D1',
  '#FFC0CB',
] as const

/** Default gradient shown when no custom color is selected. */
const DEFAULT_GRADIENT =
  'linear-gradient(to right, rgb(235, 87, 87), rgb(242, 201, 76), rgb(76, 183, 130), rgb(78, 167, 252), rgb(250, 96, 122))'

/** Check if the active color is one of the preset options. */
const isPresetColor = computed(() =>
  colorOptions.includes(activeColor as (typeof colorOptions)[number]),
)

/** Check if a custom color is being used (not in the preset list). */
const isCustomColor = computed(
  () => activeColor && !isPresetColor.value && !showCustomInput.value,
)

/** Check if the given color matches the currently active color. */
const isActiveColor = (color: string): boolean => activeColor === color

/**
 * Style for the custom color button.
 * Shows the actual color if custom, otherwise shows a gradient.
 */
const customButtonStyle = computed(() => {
  const displayColor = customColor.value || activeColor
  return isCustomColor.value || customColor.value
    ? `background-color: ${displayColor};`
    : `background: ${DEFAULT_GRADIENT};`
})

/**
 * Toggle the custom color input visibility.
 * Focuses the input after it becomes visible.
 */
const toggleCustomInput = async () => {
  showCustomInput.value = !showCustomInput.value
  showSelector.value = false

  if (!showCustomInput.value) {
    return
  }

  await nextTick()
  customColorInputRef.value?.focus()
}

/** Toggle the color selector visibility. */
const toggleSelector = (): void => {
  showSelector.value = !showSelector.value
}

/**
 * Select a color and emit the selection event.
 * Ensures the color value has a # prefix for hex colors.
 */
const selectColor = (color: string): void => {
  const formattedColor = color && !color.startsWith('#') ? `#${color}` : color
  emit('select', formattedColor)
  showSelector.value = false
}

/**
 * Handle custom color input changes.
 * Formats the color and emits the selection.
 */
const handleCustomColorInput = (): void => {
  if (!customColor.value) {
    return
  }

  const formattedColor = customColor.value.startsWith('#')
    ? customColor.value
    : `#${customColor.value}`

  customColor.value = formattedColor
  selectColor(formattedColor)
}
</script>
<template>
  <div>
    <!-- Collapsed view: single color dot -->
    <div
      v-if="!showCustomInput && !showSelector"
      class="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full"
      :style="{ backgroundColor: activeColor }"
      @click="toggleSelector">
      <ScalarIcon
        v-if="activeColor"
        class="text-c-btn p-0.5"
        icon="Checkmark"
        size="xs" />
    </div>

    <!-- Expanded view: color palette selector -->
    <div
      v-if="!showCustomInput && showSelector"
      class="color-selector flex h-4 flex-row items-center justify-between gap-1.5 space-x-1">
      <!-- Preset color options -->
      <div
        v-for="option in colorOptions"
        :key="option"
        class="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full"
        :style="{ backgroundColor: option }"
        @click="selectColor(option)">
        <ScalarIcon
          v-if="isActiveColor(option)"
          class="text-c-btn p-0.5"
          icon="Checkmark"
          size="xs" />
      </div>

      <!-- Divider -->
      <hr class="border-ghost h-5 w-0.5 border-l" />

      <!-- Custom color button -->
      <button
        class="z-10 flex h-4 w-4 cursor-pointer flex-row items-center justify-center gap-2 rounded-full"
        :style="customButtonStyle"
        type="button"
        @click="toggleCustomInput">
        <ScalarIcon
          v-if="isCustomColor"
          class="text-c-btn"
          icon="Checkmark"
          size="xs" />
      </button>
    </div>

    <!-- Custom color input view -->
    <div
      v-if="showCustomInput"
      class="color-selector flex h-4 flex-1 items-center gap-2 rounded">
      <span class="absolute h-4 w-4 rounded-full border border-dashed" />
      <span
        class="z-[1] h-4 w-4 rounded-full"
        :style="customButtonStyle" />
      <input
        ref="customColorInputRef"
        v-model="customColor"
        class="w-full flex-1 border-transparent text-sm outline-none"
        :placeholder="activeColor || '#000000'"
        type="text"
        @input="handleCustomColorInput" />
      <button
        class="text-c-3 hover:bg-b-2 rounded-lg p-1.5"
        type="button"
        @click="toggleCustomInput">
        <ScalarIcon
          icon="Checkmark"
          size="xs" />
      </button>
    </div>
  </div>
</template>
