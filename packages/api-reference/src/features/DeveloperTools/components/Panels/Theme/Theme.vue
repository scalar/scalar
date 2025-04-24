<script setup lang="ts">
import { ScalarListbox } from '@scalar/components'
import { computed, ref } from 'vue'

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
  // First try to get from the .scalar-app element which is the root of the application
  const scalarApp = document.querySelector('.scalar-app')
  if (scalarApp) {
    const value = getComputedStyle(scalarApp)
      .getPropertyValue(variableName)
      .trim()
    if (value !== '') {
      return value
    }
  }

  // Fallback to document.documentElement
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()

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
const borderRadius = ref(getCssVariable('--scalar-radius'))
const borderRadiusLg = ref(getCssVariable('--scalar-radius-lg'))
const borderWidth = ref(getCssVariable('--scalar-border-width'))
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
    </fieldset>

    <fieldset class="bg-b-2 w-1/3 rounded-md border p-3">
      <legend class="font-bold">Background</legend>

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
    </fieldset>

    <fieldset class="bg-b-2 w-1/3 rounded-md border p-3">
      <legend class="font-bold">Border</legend>

      <label class="mb-2 block">Border Color</label>
      <div class="mb-4 flex gap-4">
        <input
          type="color"
          v-model="borderColor" />
      </div>

      <label class="mb-2 block">Border Radius</label>
      <div class="mb-4 flex gap-4">
        <input
          type="text"
          class="p-2"
          v-model="borderRadius" />
      </div>

      <label class="mb-2 block">Border Radius Large</label>
      <div class="mb-4 flex gap-4">
        <input
          type="text"
          class="p-2"
          v-model="borderRadiusLg" />
      </div>

      <label class="mb-2 block">Border Width</label>
      <div class="mb-4 flex gap-4">
        <input
          type="text"
          class="p-2"
          v-model="borderWidth" />
      </div>
    </fieldset>
  </div>
  <component is="style">
    :root { --scalar-font: {{ selectedFont.value }}; --scalar-radius:
    {{ borderRadius || 'inherit' }}; --scalar-border-width:
    {{ borderWidth || 'inherit' }}; } .light-mode { --scalar-color-1:
    {{ color1 || 'inherit' }}; --scalar-color-2: {{ color2 || 'inherit' }};
    --scalar-color-3: {{ color3 || 'inherit' }}; --scalar-color-accent:
    {{ colorAccent || 'inherit' }}; --scalar-background-1:
    {{ bgColor1 || 'inherit' }}; --scalar-background-2:
    {{ bgColor2 || 'inherit' }}; --scalar-background-3:
    {{ bgColor3 || 'inherit' }}; --scalar-background-accent :
    {{ bgColorAccent || 'inherit' }}; --scalar-border-color:
    {{ borderColor || 'inherit' }}; }
  </component>
</template>
