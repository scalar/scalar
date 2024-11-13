<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { computed, nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    activeColor: string
    selector?: boolean
  }>(),
  {
    selector: false,
  },
)

const emit = defineEmits<{
  (e: 'select', color: string): void
}>()

const customColor = ref('')
const customColorInputRef = ref<HTMLInputElement | null>(null)
const showCustomInput = ref(false)
const showSelector = ref(false)

const colorOptions = [
  { color: '#8E8E8E' },
  { color: '#EF0006' },
  { color: '#EDBE20' },
  { color: '#069061' },
  { color: '#FB892C' },
  { color: '#0082D0' },
  { color: '#5203D1' },
  { color: '#FFC0CB' },
]

const backgroundStyle = computed(() => {
  return (props.activeColor &&
    !colorOptions.some((option) => option.color === props.activeColor)) ||
    customColor.value
    ? `background-color: ${props.activeColor || customColor.value};`
    : 'background: linear-gradient(to right, rgb(235, 87, 87), rgb(242, 201, 76), rgb(76, 183, 130), rgb(78, 167, 252), rgb(250, 96, 122));'
})

const handleClick = () => {
  showCustomInput.value = !showCustomInput.value
  if (props.selector) {
    showSelector.value = false
  }
  nextTick(() => {
    if (customColorInputRef.value) {
      customColorInputRef.value.focus()
    }
  })
}

watch(customColor, (newColor) => {
  if (newColor && !newColor.startsWith('#')) {
    customColor.value = `#${newColor}`
  }
  showCustomInput.value = true
})

const handleSelectorClick = () => {
  if (props.selector) {
    showSelector.value = !showSelector.value
  }
}

const selectColor = (color: string) => {
  emit('select', color)
  if (props.selector) {
    showSelector.value = false
  }
}
</script>
<template>
  <div>
    <template v-if="!showCustomInput">
      <div
        v-if="props.selector && !showSelector"
        class="flex cursor-pointer items-center justify-center rounded-full"
        :class="props.selector ? 'h-4 w-4' : 'h-5 w-5'"
        :style="{ backgroundColor: activeColor }"
        @click="handleSelectorClick">
        <ScalarIcon
          v-if="activeColor"
          class="text-c-btn"
          :class="props.selector && 'p-0.5'"
          icon="Checkmark"
          size="xs" />
      </div>
      <div
        v-if="showSelector || !props.selector"
        class="color-selector flex flex-row gap-1.5 items-center justify-between space-x-1"
        :class="props.selector ? 'h-4' : 'min-h-10 min-w-[296px]'">
        <div
          v-for="option in colorOptions"
          :key="option.color"
          class="flex cursor-pointer items-center justify-center rounded-full"
          :class="props.selector ? 'h-4 w-4' : 'h-5 w-5'"
          :style="{ backgroundColor: option.color }"
          @click="selectColor(option.color)">
          <ScalarIcon
            v-if="activeColor === option.color && !customColor"
            class="text-c-btn"
            :class="props.selector && 'p-0.5'"
            icon="Checkmark"
            size="xs" />
        </div>
        <hr class="w-0.5 h-5 border-ghost border-l" />
        <label
          class="cursor-pointer flex flex-row justify-center gap-2 items-center rounded-full z-10"
          :class="props.selector ? 'h-4 w-4' : 'h-5 w-5'"
          :style="backgroundStyle"
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
    <div
      v-if="showCustomInput"
      class="color-selector flex flex-1 gap-2 items-center rounded"
      :class="props.selector ? 'h-4' : 'min-h-10'">
      <span
        class="absolute border border-dashed rounded-full"
        :class="props.selector ? 'h-4 w-4' : 'h-5 w-5'" />
      <span
        class="rounded-full z-[1]"
        :class="props.selector ? 'h-4 w-4' : 'h-5 w-5'"
        :style="backgroundStyle">
      </span>
      <input
        ref="customColorInputRef"
        v-model="customColor"
        class="border-transparent flex-1 outline-none w-full text-sm"
        :placeholder="activeColor || '#000000'"
        type="text"
        @input="selectColor(customColor)" />
      <button
        class="text-c-3 hover:bg-b-2 p-1.5 rounded-lg"
        type="button"
        @click="handleClick">
        <ScalarIcon
          icon="Checkmark"
          size="xs" />
      </button>
    </div>
  </div>
</template>
