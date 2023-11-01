<script setup lang="ts">
import { type ReferenceConfiguration } from '@scalar/api-reference'
import { availableThemes } from '@scalar/themes'
import { computed, ref, watch } from 'vue'

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
const showToolbar = ref(true)

const docStyle = document.documentElement.style

watch(
  showToolbar,
  (show) => {
    if (show) docStyle.setProperty('--theme-header-height', '40px')
    else docStyle.removeProperty('--theme-header-height')
  },
  { immediate: true },
)
</script>
<template>
  <header
    v-if="showToolbar"
    class="references-dev-header">
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
      <button
        class="references-dev-hide-toolbar"
        type="button"
        @click="showToolbar = false">
        Hide
      </button>
    </div>
  </header>

  <button
    v-else
    class="references-dev-show-toolbar"
    type="button"
    @click="showToolbar = true">
    Dev Toolbar
  </button>
</template>
<style scoped>
.references-dev-header {
  display: flex;
  justify-content: space-between;
  color: var(--default-theme-color-1);

  width: 100%;
  height: var(--refs-header-height);

  background: var(--default-theme-background-1);
  border-bottom: 1px solid var(--default-theme-border-color);
}
.references-dev-title {
  font-weight: bold;
  display: flex;
  align-items: center;
  padding: 0px 8px;

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

.references-dev-show-toolbar {
  position: fixed;
  z-index: 1000;
  top: 8px;
  right: 8px;

  padding: 4px 8px;

  font-size: var(--default-theme-small);
  font-weight: 500;

  color: var(--default-theme-color-1);
  background: var(--default-theme-background-1);
  border: 1px solid var(--default-theme-border-color);
  border-radius: var(--default-theme-radius);
  box-shadow: var(--default-theme-shadow-1);
}

.references-dev-show-toolbar:hover,
.references-dev-hide-toolbar:hover {
  background: var(--default-theme-background-2);
}
</style>
