<script lang="ts" setup>
defineProps<{
  modelValue: any
  options: {
    value: string
    label: string
    options?: {
      value: string
      label: string
    }[]
  }[]
}>()

defineEmits<{
  (event: 'update:modelValue', value: any): void
}>()
</script>

<template>
  <div
    class="text-select"
    :class="options.length === 1 ? 'text-select--single-option' : ''">
    <span>
      <slot />
    </span>
    <select
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
  </div>
</template>

<style>
.text-select {
  position: relative;
  height: fit-content;
}
.text-select--single-option {
  pointer-events: none;
}
.text-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--theme-background-3, var(--default-theme-background-3));
  box-shadow: -2px 0 0 0
    var(--theme-background-3, var(--default-theme-background-3));
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
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
.text-select:hover span {
  color: var(--theme-color-1, var(--default-theme-color-1));
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
  background: var(--theme-background-2, var(--default-theme-background-2));
}
</style>
