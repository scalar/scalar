<script lang="ts" setup>
import { CodeMirror } from '@scalar/use-codemirror'
import { ref, watch } from 'vue'

import { prettyPrintJson } from '../../../helpers'
import { Icon } from '../../Icon'
import TextSelect from './TextSelect.vue'

const props = withDefaults(
  defineProps<{
    examples: Record<string, any>
    renderExample?: boolean
  }>(),
  {
    renderExample: false,
  },
)

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
  <div
    v-if="renderExample"
    class="example-selector-layout">
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
    <CodeMirror
      v-if="selectedExampleKey && props.examples[selectedExampleKey]"
      :content="prettyPrintJson(props.examples[selectedExampleKey])"
      :languages="['json']"
      readOnly />
  </div>
  <TextSelect
    v-else
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
.example-selector-layout {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: start;
  padding-top: 6px;
}
</style>
