<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  modelValue: any
  options: {
    value: string
    label: string
    options?: {
      value: string
      label: string
    }[]
  }[]
  controls?: string
}>()

defineEmits<{
  (event: 'update:modelValue', value: any): void
}>()

const count = computed(
  () => props.options.flatMap((o) => o.options ?? o).length,
)
</script>
<template>
  <label
    class="text-select"
    :class="count === 1 ? 'text-select--single-option' : ''">
    <span class="text-select-label">
      <slot />
    </span>
    <select
      :aria-controls="controls"
      :tabindex="options.length === 1 ? -1 : 0"
      :value="modelValue"
      @input="
        (event) =>
          $emit('update:modelValue', (event.target as HTMLSelectElement).value)
      ">
      <template
        v-for="option in options"
        :key="option.value">
        <template v-if="option.options">
          <optgroup :label="option.label">
            <option
              v-for="child in option.options"
              :key="child.value"
              :value="child.value">
              {{ child.label }}
            </option>
          </optgroup>
        </template>
        <template v-else>
          <option
            :key="option.value"
            :value="option.value">
            {{ option.label }}
          </option>
        </template>
      </template>
    </select>
  </label>
</template>

<style>
.text-select {
  position: relative;
  height: fit-content;
}
.text-select:has(:focus-visible) .text-select-label {
  outline: 1px solid var(--scalar-color-accent);
  outline-offset: 4px;
  border-radius: calc(var(--scalar-radius) / 2);
}
.text-select--single-option {
  pointer-events: none;
}
.text-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--scalar-background-3);
  box-shadow: -2px 0 0 0 var(--scalar-background-3);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}
.text-select span {
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
.text-select:hover span {
  color: var(--scalar-color-1);
}
.text-select:not(.text-select--single-option) span::after {
  content: '';
  width: 7px;
  height: 7px;
  transform: rotate(45deg) translate3d(-2px, -2px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
}
.text-select span:hover {
  background: var(--scalar-background-2);
}
</style>
