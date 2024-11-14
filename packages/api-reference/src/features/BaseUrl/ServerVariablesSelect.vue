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
  controls?: string
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
      class="variable-select"
      fullWidth
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
        icon="ChevronDown"
        size="xs" />
    </ScalarButton>
  </ScalarListbox>
</template>

<style scoped>
.variable-select {
  padding: 9px 9px 9px 0;
  color: var(--scalar-color-1);
  align-items: center;
  border-color: transparent;
  border-radius: 0;
  border-top: 0.5px solid var(--scalar-border-color);
  display: flex;
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-regular);
  gap: 3px;
  height: auto;
  outline: none;
  width: 100%;
}
.variable-select svg {
  color: var(--scalar-color-2);
  stroke-width: 1;
}
</style>
