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

/** Computed config proxy for v-model
 * @see https://skirtles-code.github.io/vue-examples/patterns/computed-v-model.html#advanced-usage-proxying-objects */
const configuration = computed(
  () =>
    new Proxy(props.modelValue, {
      set(obj, key, value) {
        emit('update:modelValue', { ...obj, [key]: value })
        return true
      },
    }),
)

// The collaborative editing configuration is an object and not just true/false, that’s
// why we’re keeping track of it separately.
const enableCollaborativeEditingRef = ref<boolean>(false)
const collaborativeEditingDocumentRef = ref<string>('document-1')

// This adds the collaborative editing configuration to the configuration object.
function getCompleteConfiguration(v: any) {
  if (enableCollaborativeEditingRef.value) {
    return {
      ...v,
      hocuspocusConfiguration: {
        name: collaborativeEditingDocumentRef.value,
        token: 'secret',
        url: 'ws://localhost:1234',
      },
    }
  }

  return {
    ...v,
    hocuspocusConfiguration: undefined,
  }
}

// If one of the separate refs update, emit the new configuration
watch([enableCollaborativeEditingRef, collaborativeEditingDocumentRef], () => {
  emit('update:modelValue', getCompleteConfiguration(configuration.value))
})

const docStyle = document.documentElement.style

// Toggle the toolbar visibility
const showToolbar = ref(true)
watch(
  showToolbar,
  (show) => {
    if (show) {
      docStyle.setProperty('--theme-header-height', '40px')
    } else {
      docStyle.removeProperty('--theme-header-height')
    }
  },
  { immediate: true },
)
</script>
<template>
  <header
    v-if="showToolbar"
    class="references-dev-header">
    <a
      class="references-dev-title"
      href="/"
      title="Back to homepage">
      Dev Toolbar
    </a>
    <div class="references-dev-options">
      <div>
        <input
          v-model="configuration.isEditable"
          type="checkbox" />
        isEditable
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
      <div>
        <input
          v-model="enableCollaborativeEditingRef"
          type="checkbox" />
        Collaborative Editing{{ enableCollaborativeEditingRef ? ':' : '' }}
        <select
          v-if="enableCollaborativeEditingRef"
          v-model="collaborativeEditingDocumentRef">
          <option value="document-1">Document #1</option>
          <option value="document-2">Document #2</option>
          <option value="document-3">Document #3</option>
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
  height: var(--theme-header-height);

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
