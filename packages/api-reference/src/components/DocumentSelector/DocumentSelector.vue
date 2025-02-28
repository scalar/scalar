<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { SpecConfiguration } from '@scalar/types'
import { computed } from 'vue'

const { options } = defineProps<{
  options?: SpecConfiguration[]
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Show the selector if there are multiple options
const showSelector = computed(() => options && options?.length > 1)

// Emit the selected option
const handleChange = (event: Event) => {
  emit(
    'update:modelValue',
    Number.parseInt((event.target as HTMLSelectElement).value, 10),
  )
}
</script>

<template>
  <template v-if="showSelector">
    <div class="-mb-1 p-3 pb-0">
      <div class="sidebar-document-selector relative">
        <select
          class="absolute left-0 h-full w-full cursor-pointer rounded border opacity-0"
          :value="modelValue"
          @change="handleChange">
          <option
            v-for="(option, index) in options"
            :key="index"
            :value="index">
            <template v-if="option.title">
              {{ option.title }}
            </template>
            <template v-else-if="option.slug">
              {{ option.slug }}
            </template>
            <template v-else>API #{{ index + 1 }}</template>
          </option>
        </select>
        <ScalarIcon
          class="scalar-document-selector-icon"
          icon="Versions"
          size="md"
          thickness="2.5" />
        <!-- hide from screen readers so text is not read out twice -->
        <span
          aria-hidden="true"
          class="scalar-document-selector-text text-c-1 pointer-events-none w-full text-sm font-medium">
          {{
            options?.[modelValue]?.title ||
            options?.[modelValue]?.slug ||
            `API #${(modelValue || 0) + 1}`
          }}
        </span>
        <ScalarIcon
          class="scalar-document-selector-chevron"
          icon="ChevronDown"
          size="md"
          thickness="2.5" />
      </div>
    </div>
  </template>
</template>
<style scoped>
.sidebar-document-selector {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 9px;
  min-width: 254px;
  max-width: 100%;
  font-family: var(--scalar-font);
  background: var(
    --scalar-sidebar-search-background,
    var(--scalar-background-1)
  );
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
  border-radius: var(--scalar-radius);
  box-shadow: 0 0 0 0.5px
    var(--scalar-sidebar-search-border-color, var(--scalar-border-color));
  /* prettier-ignore */
  cursor: pointer;
  appearance: none;
  border: none;
  height: 31px;
}
.sidebar-document-selector:focus-within {
  box-shadow: 0 0 0 1px var(--scalar-color-accent);
}
.scalar-document-selector-icon {
  padding: 0;
  margin-right: 6px;
  width: 12px;
}
.sidebar-document-selector:hover .scalar-document-selector-chevron {
  color: var(--scalar-sidebar-color-1, var(--scalar-color-1));
}
.scalar-document-selector-text {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
