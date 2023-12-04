<script setup lang="ts">
defineProps<{
  label: string
  error?: boolean
  loaderState?: LoadingState
  variant?: ButtonVariant
  title?: string
}>()
</script>
<script lang="ts">
import FlowLoader, {
  type LoadingState,
  useLoaderState as useLoadButtonState,
} from './FlowLoader.vue'

export type ButtonVariant = 'solid' | 'outlined' | 'clear' | 'text'
export { useLoadButtonState }
</script>
<template>
  <button
    class="flow-button"
    :class="{
      'flow-button-outlined': !error && variant === 'outlined',
      'flow-button-clear': !error && variant === 'clear',
      'flow-button-text': !error && variant === 'text',
      'flow-button--delete': error,
    }"
    :title="title || label"
    type="button">
    <div
      v-if="$slots.default"
      class="flow-button-decorator">
      <slot />
    </div>
    <span>{{ label }}</span>
    <div class="flow-button-loader">
      <FlowLoader
        v-if="loaderState"
        :loaderState="loaderState" />
    </div>
  </button>
</template>
<style scoped>
.flow-button {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  position: relative;
  appearance: none;
  -webkit-appearance: none;
  height: 40px;
  padding: 0px 24px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  color: var(--theme-button-1-color, var(--default-theme-button-1-color));
  font-size: var(--theme-small, var(--default-theme-small));
  font-weight: 500;
  cursor: pointer;
  background: var(--theme-button-1, var(--default-theme-button-1));
  border: none;
  width: 100%;
  box-shadow: rgba(0, 0, 0, 0.09) 0px 1px 4px;
}

.flow-button:hover,
.flow-button:focus-visible {
  background: var(--theme-button-1-hover, var(--default-theme-button-1-hover));
}
.flow-button:active {
  box-shadow: none;
  background: var(--theme-button-1, var(--default-theme-button-1));
}
.flow-button[disabled] {
  background: var(--theme-background-2, var(--default-theme-background-2));
  color: var(--theme-color-3, var(--default-theme-color-3));
  cursor: unset;
  box-shadow: none;
}

/* ----------------------------------------------------- */
.flow-button-outlined {
  background: var(--theme-background-1, var(--default-theme-background-1));
  color: var(--theme-color-1, var(--default-theme-color-1));
  padding: 11px 23px;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  box-shadow: rgba(0, 0, 0, 0.09) 0px 1px 4px;
}
.flow-button-outlined:hover,
.flow-button-outlined:focus-visible {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.flow-button-outlined:active {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.flow-button-outlined[disabled] {
  background: var(--theme-background-2, var(--default-theme-background-2));
  color: var(--theme-color-3, var(--default-theme-color-3));
  cursor: unset;
  box-shadow: none;
}

/* ----------------------------------------------------- */
.flow-button-clear {
  background: transparent;
  box-shadow: none;
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.flow-button-clear:active {
  background: transparent;
}
.flow-button-clear:hover,
.flow-button-clear:focus-visible {
  background: var(--theme-background-2, var(--default-theme-background-2));
  box-shadow: none;
}
.flow-button-clear[disabled] {
  background: var(--theme-background-2, var(--default-theme-background-2));
  color: var(--theme-color-3, var(--default-theme-color-3));
  cursor: unset;
  box-shadow: none;
}

/* ----------------------------------------------------- */
.flow-button-text {
  background: transparent;
  box-shadow: none;
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.flow-button-text:active {
  background: transparent;
}
.flow-button-text:hover,
.flow-button-text:focus-visible {
  color: var(--theme-color-2, var(--default-theme-color-2));
  background: transparent;
  box-shadow: none;
}
.flow-button-text[disabled] {
  background: transparent;
  color: var(--theme-color-ghost, var(--default-theme-color-ghost));
  cursor: unset;
  box-shadow: none;
}

/* ----------------------------------------------------- */

.flow-button--delete {
  background: var(--theme-error-color, var(--default-theme-color-red));
  color: white;
}
.flow-button--delete:active {
  background: var(--theme-error-color, var(--default-theme-color-red));
}
.flow-button--delete:hover {
  background: var(--theme-error-color, var(--default-theme-color-red));
  opacity: 0.86;
}

/* ----------------------------------------------------- */

.flow-button-loader {
  position: absolute;
  right: 8px;
}
.flow-button-decorator {
  margin-right: 9px;
  color: currentColor;
  display: flex;
  align-items: center;
  height: 14px;
  width: 14px;
}
</style>
