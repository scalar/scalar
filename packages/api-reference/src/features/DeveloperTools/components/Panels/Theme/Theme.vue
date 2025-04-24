<script setup lang="ts">
import { ScalarListbox } from '@scalar/components'
import { computed, onMounted, ref } from 'vue'

// A list of system font-family font stacks (sans-serif, serif, monospace, Comic Sans)
const fonts = [
  'system-ui, sans-serif',
  'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
  '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
  'ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace',
  'Comic Sans MS, Comic Sans, cursive',
] as const

// Create options array for ScalarListbox
const fontOptions = computed(() =>
  fonts.map((font) => ({
    id: font,
    label: font,
    value: font,
  })),
)

// Create ref for selected font, initialize with first font
const selectedFont = ref(fontOptions.value[0])

// Helper function to get CSS variable value
const getCssVariable = (variableName: string) => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()

  // TODO: This doesn't work
  console.log(variableName, value)

  return value === '' ? undefined : value
}

const color1 = ref(getCssVariable('--scalar-color-1'))
const color2 = ref(getCssVariable('--scalar-color-2'))
const color3 = ref(getCssVariable('--scalar-color-3'))
const colorAccent = ref(getCssVariable('--scalar-color-accent'))
const bgColor1 = ref(getCssVariable('--scalar-background-1'))
const bgColor2 = ref(getCssVariable('--scalar-background-2'))
const bgColor3 = ref(getCssVariable('--scalar-background-3'))
const bgColorAccent = ref(getCssVariable('--scalar-background-accent'))
const borderColor = ref(getCssVariable('--scalar-border-color'))
</script>

<template>
  <div class="flex gap-2">
    <fieldset class="bg-b-2 w-1/3 rounded-md border p-3">
      <legend class="font-bold">Typography</legend>

      <label class="mb-2 block">Font</label>
      <div class="mb-4 flex gap-4">
        <div class="flex items-center gap-1">
          <ScalarListbox
            :options="fontOptions"
            :model-value="selectedFont"
            @update:model-value="
              (selectedOption) => (selectedFont = selectedOption)
            ">
            <template #default="{ open }">
              <div
                class="flex items-center justify-between gap-2 rounded border px-2 py-1.5">
                <span>{{ selectedFont.label }}</span>
                <ScalarIcon
                  class="text-c-2"
                  icon="ChevronDown"
                  size="sm" />
              </div>
            </template>
          </ScalarListbox>
        </div>
      </div>

      <label class="mb-2 block">Color 1</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="color1" />
      </div>

      <label class="mb-2 block">Color 2</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="color2" />
      </div>

      <label class="mb-2 block">Color 3</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="color3" />
      </div>

      <label class="mb-2 block">Color Accent</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="colorAccent" />
      </div>

      <label class="mb-2 block">Background Color 1</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="bgColor1" />
      </div>

      <label class="mb-2 block">Background Color 2</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="bgColor2" />
      </div>

      <label class="mb-2 block">Background Color 3</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="bgColor3" />
      </div>

      <label class="mb-2 block">Background Color Accent</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="bgColorAccent" />
      </div>

      <label class="mb-2 block">Border Color</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="borderColor" />
      </div>
    </fieldset>
  </div>
  <component is="style">
    :root { --scalar-font: {{ selectedFont.value }}; } .light-mode {
    --scalar-color-1: {{ color1 || 'inherit' }}; --scalar-color-2:
    {{ color2 || 'inherit' }}; --scalar-color-3: {{ color3 || 'inherit' }};
    --scalar-color-accent: {{ colorAccent || 'inherit' }};
    --scalar-background-1: {{ bgColor1 || 'inherit' }}; --scalar-background-2:
    {{ bgColor2 || 'inherit' }}; --scalar-background-3:
    {{ bgColor3 || 'inherit' }}; --scalar-background-accent :
    {{ bgColorAccent || 'inherit' }}; --scalar-border-color:
    {{ borderColor || 'inherit' }}; }
  </component>
</template>
