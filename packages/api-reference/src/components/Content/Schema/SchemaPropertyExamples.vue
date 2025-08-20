<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import { formatExample } from './helpers/format-example'

defineProps<{
  examples?: unknown
  example?: unknown
}>()

const { copyToClipboard } = useClipboard()
</script>
<template>
  <!-- single example (deprecated) -->
  <template v-if="example">
    <div class="property-example">
      <button
        type="button"
        class="property-example-label">
        <span>Example</span>
      </button>
      <div class="property-example-value-list">
        <button
          type="button"
          class="property-example-value group"
          @click="copyToClipboard(String(formatExample(example)))">
          <span>
            {{ formatExample(example) }}
          </span>
          <ScalarIcon
            icon="Clipboard"
            size="xs"
            class="group-hover:text-c-1 text-c-3 ml-auto min-h-3 min-w-3" />
        </button>
      </div>
    </div>
  </template>

  <!-- multiple examples -->
  <template
    v-if="
      examples &&
      typeof examples === 'object' &&
      Object.keys(examples).length > 0
    ">
    <div class="property-example">
      <button
        type="button"
        class="property-example-label">
        <span>
          {{ Object.keys(examples).length === 1 ? 'Example' : 'Examples' }}
        </span>
      </button>
      <div class="property-example-value-list">
        <button
          type="button"
          v-for="(example, key) in examples"
          :key="key"
          class="property-example-value group"
          @click="copyToClipboard(String(formatExample(example)))">
          <span>{{ formatExample(example) }} </span>
          <ScalarIcon
            icon="Clipboard"
            size="xs"
            class="text-c-3 group-hover:text-c-1 ml-auto min-h-3 min-w-3" />
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.property-example {
  display: flex;
  flex-direction: column;
  font-size: var(--scalar-mini);
  position: relative;
}
.property-example:hover:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  border-radius: var(--scalar-radius);
}
.property-example:hover .property-example-label span {
  color: var(--scalar-color-1);
}
.property-example-label span {
  color: var(--scalar-color-3);
  position: relative;
  border-bottom: var(--scalar-border-width) dotted currentColor;
}
.property-example-value {
  font-family: var(--scalar-font-code);
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 6px;
}
.property-example-value span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.property-example-value :deep(svg) {
  color: var(--scalar-color-3);
}

.property-example-value:hover :deep(svg) {
  color: var(--scalar-color-1);
}

.property-example-value {
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
.property-example-value-list {
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
  z-index: 10;
}
.property-example:hover .property-example-value-list,
.property-example:focus-within .property-example-value-list {
  display: flex;
}
</style>
