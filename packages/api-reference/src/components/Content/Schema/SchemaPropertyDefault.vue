<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import { formatExample } from './helpers/format-example'

defineProps<{
  value?: unknown
}>()

const { copyToClipboard } = useClipboard()
</script>
<template>
  <template v-if="value !== undefined">
    <div class="property-default">
      <button
        class="property-default-label"
        type="button">
        <span>Default</span>
      </button>
      <div class="property-default-value-list">
        <button
          class="property-default-value group"
          type="button"
          @click="copyToClipboard(formatExample(value))">
          <span>
            {{ formatExample(value) }}
          </span>
          <ScalarIcon
            class="group-hover:text-c-1 text-c-3 ml-auto min-h-3 min-w-3"
            icon="Clipboard"
            size="xs" />
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.property-default {
  display: flex;
  flex-direction: column;
  font-size: var(--scalar-mini);
  position: relative;
}
.property-default:hover:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  border-radius: var(--scalar-radius);
}
.property-default:hover .property-default-label span {
  color: var(--scalar-color-1);
}
.property-default-label span {
  color: var(--scalar-color-3);
  position: relative;
  border-bottom: var(--scalar-border-width) dotted currentColor;
}
.property-default-value {
  font-family: var(--scalar-font-code);
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 6px;
}
.property-default-value span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.property-default-value :deep(svg) {
  color: var(--scalar-color-3);
}

.property-default-value:hover :deep(svg) {
  color: var(--scalar-color-1);
}

.property-default-value {
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
.property-default-value-list {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  overflow: auto;
  background-color: var(--scalar-background-1);
  box-shadow: var(--scalar-shadow-1);
  border-radius: var(--scalar-radius-lg);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  padding: 9px;
  min-width: 200px;
  max-width: 300px;
  flex-direction: column;
  gap: 3px;
  display: none;
  z-index: 2;
}
.property-default:hover .property-default-value-list,
.property-default:focus-within .property-default-value-list {
  display: flex;
}
</style>
