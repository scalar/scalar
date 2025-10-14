<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { computed, nextTick, ref } from 'vue'

const { activeColor } = defineProps<{
  activeColor: string
}>()

const emit = defineEmits<{
  (e: 'select', color: string): void
}>()

const customColorRaw = ref('')

/** Make sure to add '#' prefix to the color value */
const customColor = computed({
  get: () => customColorRaw.value,
  set: (value: string) => {
    if (value && !value.startsWith('#')) {
      customColorRaw.value = `#${value}`
    } else {
      customColorRaw.value = value
    }
    if (value) {
      showCustomInput.value = true
    }
  },
})
const customColorInputRef = ref<HTMLInputElement | null>(null)
const showCustomInput = ref(false)

const colorOptions = [
  { color: '#FFFFFF' },
  { color: '#EF0006' },
  { color: '#EDBE20' },
  { color: '#069061' },
  { color: '#FB892C' },
  { color: '#0082D0' },
  { color: '#5203D1' },
  { color: '#FFC0CB' },
]

const linearGradient =
  'linear-gradient(to right, rgb(235, 87, 87), rgb(242, 201, 76), rgb(76, 183, 130), rgb(78, 167, 252), rgb(250, 96, 122));'

const isCustomColor = computed(() => {
  return (
    (activeColor &&
      !colorOptions.some((option) => option.color === activeColor)) ||
    customColor.value
  )
})

const backgroundColor = computed(() => {
  return `background: ${
    isCustomColor.value ? (activeColor ?? customColor.value) : linearGradient
  }`
})

const handleClick = () => {
  showCustomInput.value = !showCustomInput.value
  nextTick(() => {
    if (customColorInputRef.value) {
      customColorInputRef.value.focus()
    }
  })
}

const selectColor = (color: string) => {
  emit('select', color)
}
</script>
<template>
  <!-- Show color selector -->
  <template v-if="!showCustomInput">
    <div
      class="flex min-h-10 min-w-[296px] flex-row items-center justify-between gap-1.5 space-x-1">
      <div
        v-for="option in colorOptions"
        :key="option.color"
        class="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full"
        data-testid="color-option"
        :style="{ backgroundColor: option.color }"
        @click="selectColor(option.color)">
        <ScalarIcon
          v-if="activeColor === option.color && !customColor"
          class="text-c-btn"
          icon="Checkmark"
          size="xs" />
      </div>
      <hr class="border-ghost h-5 w-0.5 border-l" />
      <label
        class="z-10 flex h-5 w-5 cursor-pointer flex-row items-center justify-center gap-2 rounded-full"
        :style="backgroundColor"
        @click="handleClick">
        <ScalarIcon
          v-if="
            !showCustomInput &&
            (activeColor === customColor ||
              (activeColor &&
                !colorOptions.some((option) => option.color === activeColor)))
          "
          class="text-c-btn"
          icon="Checkmark"
          size="xs" />
      </label>
    </div>
  </template>
  <!-- Custom color input -->
  <div
    v-else
    class="flex min-h-10 flex-1 items-center gap-2 rounded">
    <span class="absolute h-5 w-5 rounded-full border border-dashed" />
    <span
      class="z-[1] h-5 w-5 rounded-full"
      :style="backgroundColor">
    </span>
    <input
      ref="customColorInputRef"
      v-model="customColor"
      class="w-full flex-1 border-transparent text-sm outline-none"
      :placeholder="activeColor || '#000000'"
      type="text"
      @input="selectColor(customColor)" />
    <button
      class="text-c-3 hover:bg-b-2 rounded-lg p-1.5"
      type="button"
      @click="handleClick">
      <ScalarIcon
        icon="Checkmark"
        size="xs" />
    </button>
  </div>
</template>
