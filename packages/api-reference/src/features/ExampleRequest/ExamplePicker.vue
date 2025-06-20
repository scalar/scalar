<script lang="ts" setup>
import { ref, watch } from 'vue'

import ScreenReader from '../../components/ScreenReader.vue'
import TextSelect from './TextSelect.vue'

const props = defineProps<{
  examples: Record<string, any>
}>()

// Keep track of the selected example
const selectedExampleKey = defineModel<string>()
function selectExampleKey(key: string) {
  if (key) {
    selectedExampleKey.value = key
  }
}

// Watch for new examples
watch(
  () => props.examples,
  () => {
    if (props.examples[selectedExampleKey.value ?? '']) {
      return
    }

    selectExampleKey(Object.keys(props.examples)[0])
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
    <ScreenReader>Selected Example Values:</ScreenReader>
    {{ getLabel(selectedExampleKey ?? 'Unknown') }}
  </TextSelect>
</template>
<style scoped>
.example-selector {
  padding: 4px;
}
</style>
