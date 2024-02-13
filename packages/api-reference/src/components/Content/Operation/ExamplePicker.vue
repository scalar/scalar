<script lang="ts" setup>
import { ref, watch } from 'vue'

import TextSelect from './TextSelect.vue'

const props = defineProps<{
  examples: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

// Keep track of the selected example
const selectedExampleKey = ref<string>(Object.keys(props.examples)[0])
function selectExampleKey(key: string) {
  if (key) {
    selectedExampleKey.value = key
  }
}

// Watch for new examples
watch(
  () => props.examples,
  () => {
    selectExampleKey(Object.keys(props.examples)[0])
  },
  { immediate: true },
)

// Propagate changes
watch(
  selectedExampleKey,
  () => {
    if (!selectedExampleKey.value) {
      return
    }

    emit('update:modelValue', selectedExampleKey.value)
  },
  { immediate: true },
)

// Render text
function getLabel(key: string | null) {
  if (!key) {
    return 'Select an example'
  }

  const example = props.examples[key]

  return example?.summary ?? key
}
</script>
<template>
  <TextSelect
    v-model="selectedExampleKey"
    class="example-selector"
    :options="
      Object.keys(examples).map((value) => ({
        label: getLabel(value),
        value,
      }))
    ">
    {{ getLabel(selectedExampleKey) }}
  </TextSelect>
</template>
<style scoped>
.example-selector {
  padding: 4px;
}
</style>
