<script setup lang="ts">
import { ScalarListbox } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
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
    class="document-selector p-3 pb-0">
    <ScalarListbox
      v-slot="{ open }"
      :modelValue="selected"
      :options="formattedOptions"
      resize
      @update:modelValue="(e) => emit('update:modelValue', e.id)">
      <button
        class="group/dropdown-label text-c-2 hover:text-c-1 flex w-full cursor-pointer items-center gap-1 font-medium"
        type="button">
        <span class="overflow-hidden text-base text-ellipsis">
          {{ selected?.label || 'Select API' }}
        </span>
        <ScalarIconCaretDown
          class="size-3 text-current transition-transform"
          :class="{ 'rotate-180': open }"
          weight="bold" />
      </button>
    </ScalarListbox>
  </div>
</template>
