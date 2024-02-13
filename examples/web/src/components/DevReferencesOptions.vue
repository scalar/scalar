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
    }
  }

  return {
    ...v,
  }
}

// If one of the separate refs update, emit the new configuration
watch([enableCollaborativeEditingRef, collaborativeEditingDocumentRef], () => {
  emit('update:modelValue', getCompleteConfiguration(configuration.value))
})
</script>
<template>
  <div>
    <input
      v-model="configuration.isEditable"
      type="checkbox" />
    isEditable
  </div>
  <div>
    <input
      v-model="configuration.showSidebar"
      type="checkbox" />
    showSidebar
  </div>
  <div>
    proxy:
    <input
      v-model="configuration.proxy"
      type="text" />
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
      v-model="configuration.darkMode"
      type="checkbox" />
    darkMode
  </div>
  <div>
    Layout:
    <select v-model="configuration.layout">
      <option
        v-for="layout in ['modern', 'classic']"
        :key="layout"
        :value="layout">
        {{ layout }}
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
</template>
