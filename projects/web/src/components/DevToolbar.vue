<script setup lang="ts">
import { type ReferenceConfiguration } from '@scalar/api-reference'
import { availableThemes } from '@scalar/themes'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: ReferenceConfiguration
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: ReferenceConfiguration): void
}>()

const configuration = computed({
  get: () => props.modelValue,
  set: (v: ReferenceConfiguration) => emit('update:modelValue', v),
})
</script>
<template>
  <header class="references-dev-header">
    <div class="references-dev-title">Dev Toolbar</div>
    <div class="references-dev-options">
      <div>
        <input
          v-model="configuration.isEditable"
          type="checkbox" />
        isEditable
      </div>
      <div>
        <input
          v-model="configuration.footerBelowSidebar"
          type="checkbox" />
        footerBelowSidebar
      </div>
      <div>
        Theme:
        <select v-model="configuration.theme">
          <option
            v-for="theme in availableThemes"
            :key="theme"
            :value="theme">
            {{ theme }}
          </option>
        </select>
      </div>
    </div>
  </header>
</template>
<style>
:root {
  --theme-header-height: 40px;
}
.references-dev-header {
  display: flex;
  justify-content: space-between;
  color: var(--default-theme-color-1);

  width: 100%;
  height: var(--refs-header-height);

  padding: 0px 8px;

  background: var(--default-theme-background-1);
  border-bottom: 1px solid var(--default-theme-border-color);
}
.references-dev-title {
  font-weight: bold;
  display: flex;
  align-items: center;

  min-width: 0;
  flex: 1;

  white-space: nowrap;
  overflow: hidden;
}

.references-dev-options {
  display: flex;
  font-size: var(--default-theme-small);
}

.references-dev-options > * {
  padding: 0px 12px;
  border-left: 1px solid var(--default-theme-border-color);
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
