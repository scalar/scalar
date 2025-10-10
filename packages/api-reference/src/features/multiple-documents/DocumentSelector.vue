<script setup lang="ts">
import { ScalarListbox } from '@scalar/components'
import { ScalarIconCaretUpDown } from '@scalar/icons'
import { computed } from 'vue'

const props = defineProps<{
  options: { label: string; id: string }[]
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

const formattedOptions = computed(() =>
  props.options.map((o) => ({ id: o.id, label: o.label })),
)

const selected = computed(() =>
  formattedOptions.value.find((o) => o.id === props.modelValue),
)
</script>

<template>
  <div
    v-if="options.length > 1"
    class="document-selector -mb-1 p-3 pb-0">
    <ScalarListbox
      :modelValue="selected"
      :options="formattedOptions"
      resize
      @update:modelValue="(e) => emit('update:modelValue', e.id)">
      <button
        class="group/dropdown-label hover:bg-b-2 text-c-2 flex h-8 w-full cursor-pointer items-center rounded border px-2 py-1.75"
        type="button">
        <ScalarIconCaretUpDown class="mr-1 size-4 text-current" />
        <span class="text-c-1 overflow-hidden text-base text-ellipsis">
          {{ selected?.label || 'Select API' }}
        </span>
      </button>
    </ScalarListbox>
  </div>
</template>
