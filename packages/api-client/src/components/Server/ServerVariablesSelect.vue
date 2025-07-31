<script setup lang="ts">
import {
  ScalarButton,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
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
      class="group/button h-8 gap-1.5 p-1.5 text-base font-normal"
      variant="ghost">
      <span :class="{ 'text-c-1': value }">
        <span
          v-if="value"
          class="sr-only">
          Selected:
        </span>
        {{ value || 'Select value' }}
      </span>
      <ScalarIconCaretDown
        weight="bold"
        class="mt-0.25 size-3 transition-transform duration-100 group-aria-expanded/button:rotate-180" />
    </ScalarButton>
  </ScalarListbox>
</template>
