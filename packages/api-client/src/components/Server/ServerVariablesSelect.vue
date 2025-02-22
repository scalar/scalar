<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import { computed } from 'vue'

const props = defineProps<{
  enum: string[]
  value: string
  controls: string | undefined
}>()

const emit = defineEmits<{
  (e: 'change', v: string): void
}>()

const options = computed<ScalarListboxOption[]>(() =>
  props.enum.map((s) => ({ id: s, label: s })),
)

const selected = computed<ScalarListboxOption | undefined>({
  get: () => options.value.find((opt) => opt.id === props.value),
  set: (opt?: ScalarListboxOption) => emit('change', opt?.id ?? ''),
})
</script>
<template>
  <ScalarListbox
    v-model="selected"
    :options="options">
    <ScalarButton
      :aria-controls="controls"
      class="h-8 w-full p-0 py-1.5 font-normal"
      variant="ghost">
      <span :class="{ 'text-c-1': value }">
        <span
          v-if="value"
          class="sr-only">
          Selected:
        </span>
        {{ value || 'Select value' }}
      </span>
      <ScalarIcon
        class="ml-1"
        icon="ChevronDown"
        size="sm" />
    </ScalarButton>
  </ScalarListbox>
</template>
