<script setup lang="ts">
defineProps<{
  label: string
  error?: boolean
  loaderState?: LoadingState
  variant?: ButtonVariant
  title?: string
  icon?: boolean
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
      'flow-button-icon-only': icon,
    }"
    :title="title || label"
    type="button">
    <div
      v-if="$slots.default"
      class="flow-button-decorator">
      <slot />
    </div>
    <span :class="{ 'sr-only': icon }">{{ label }}</span>
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
  border-radius: var(--scalar-api-reference-theme-radius);
  color: var(--scalar-api-reference-theme-button-1-color);
  font-size: var(--scalar-api-reference-theme-font-size-4);
  font-weight: 500;
  cursor: pointer;
  background: var(--scalar-api-reference-theme-button-1);
  border: none;
  width: 100%;
  box-shadow: rgba(0, 0, 0, 0.09) 0px 1px 4px;
}

.flow-button:hover,
.flow-button:focus-visible {
  background: var(--scalar-api-reference-theme-button-1-hover);
}
.flow-button:active {
  box-shadow: none;
  background: var(--scalar-api-reference-theme-button-1);
}
.flow-button[disabled] {
  background: var(--scalar-api-reference-theme-background-2);
  color: var(--scalar-api-reference-theme-color-3);
  cursor: unset;
  box-shadow: none;
}

.flow-button.flow-button-icon-only {
  width: 24px;
  height: 24px;
  padding: 0;
}

/* ----------------------------------------------------- */
.flow-button-outlined {
  background: var(--scalar-api-reference-theme-background-1);
  color: var(--scalar-api-reference-theme-color-1);
  padding: 11px 23px;
  border: var(--scalar-api-reference-border);
  box-shadow: rgba(0, 0, 0, 0.09) 0px 1px 4px;
}
.flow-button-outlined:hover,
.flow-button-outlined:focus-visible {
  background: var(--scalar-api-reference-theme-background-2);
}
.flow-button-outlined:active {
  background: var(--scalar-api-reference-theme-background-2);
}
.flow-button-outlined[disabled] {
  background: var(--scalar-api-reference-theme-background-2);
  color: var(--scalar-api-reference-theme-color-3);
  cursor: unset;
  box-shadow: none;
}

/* ----------------------------------------------------- */
.flow-button-clear {
  background: transparent;
  box-shadow: none;
  color: var(--scalar-api-reference-theme-color-3);
}
.flow-button-clear:active {
  background: transparent;
}
.flow-button-clear:hover,
.flow-button-clear:focus-visible {
  background: var(--scalar-api-reference-theme-background-2);
  box-shadow: none;
}
.flow-button-clear[disabled] {
  background: var(--scalar-api-reference-theme-background-2);
  color: var(--scalar-api-reference-theme-color-3);
  cursor: unset;
  box-shadow: none;
}

/* ----------------------------------------------------- */
.flow-button-text {
  background: transparent;
  box-shadow: none;
  color: var(--scalar-api-reference-theme-color-3);
}
.flow-button-text:active {
  background: transparent;
}
.flow-button-text:hover,
.flow-button-text:focus-visible {
  color: var(--scalar-api-reference-theme-color-2);
  background: transparent;
  box-shadow: none;
}
.flow-button-text[disabled] {
  background: transparent;
  color: var(--scalar-api-reference-theme-color-ghost);
  cursor: unset;
  box-shadow: none;
}

/* ----------------------------------------------------- */

.flow-button--delete {
  background: var(--scalar-api-reference-theme-error-color);
  color: white;
}
.flow-button--delete:active {
  background: var(--scalar-api-reference-theme-error-color);
}
.flow-button--delete:hover {
  background: var(--scalar-api-reference-theme-error-color);
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
.flow-button-icon-only .flow-button-decorator {
  margin-right: 0;
}
</style>
