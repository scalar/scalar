<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { computed } from 'vue'

import LinkButton from '@/components/Content/Schema/LinkButton.vue'

import { formatExample } from './helpers/format-example'

const { examples, example } = defineProps<{
  examples?: unknown
  example?: unknown
}>()

const { copyToClipboard } = useClipboard()

const hasSingleExample = computed(() => isDefined(example))

const normalizedExamples = computed<Record<string, unknown>>(() => {
  if (examples && typeof examples === 'object') {
    return examples as Record<string, unknown>
  }

  return {}
})

const hasMultipleExamples = computed(
  () => Object.keys(normalizedExamples.value).length > 0,
)

const multipleExamplesLabel = computed(() =>
  Object.keys(normalizedExamples.value).length === 1 ? 'Example' : 'Examples',
)
</script>
<template>
  <!-- single example (deprecated) -->
  <template v-if="hasSingleExample">
    <div class="property-example">
      <LinkButton class="decoration-dotted">Example</LinkButton>
      <div class="property-example-value-list">
        <button
          class="property-example-value group"
          type="button"
          @click="copyToClipboard(formatExample(example))">
          <span>
            {{ formatExample(example) }}
          </span>
          <ScalarIcon
            class="group-hover:text-c-1 text-c-3 ml-auto min-h-3 min-w-3"
            icon="Clipboard"
            size="xs" />
        </button>
      </div>
    </div>
  </template>

  <!-- multiple examples -->
  <template v-if="hasMultipleExamples">
    <div class="property-example">
      <LinkButton class="decoration-dotted">
        {{ multipleExamplesLabel }}
      </LinkButton>
      <div class="property-example-value-list">
        <button
          v-for="(ex, key) in normalizedExamples"
          :key="key"
          class="property-example-value group"
          type="button"
          @click="copyToClipboard(formatExample(ex))">
          <span>{{ formatExample(ex) }} </span>
          <ScalarIcon
            class="text-c-3 group-hover:text-c-1 ml-auto min-h-3 min-w-3"
            icon="Clipboard"
            size="xs" />
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
@reference "../../../style.css";

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
  @apply z-context;
}
.property-example:hover .property-example-value-list,
.property-example:focus-within .property-example-value-list {
  display: flex;
}
</style>
