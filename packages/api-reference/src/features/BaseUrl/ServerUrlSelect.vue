<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import { computed } from 'vue'

import type { Server } from './types'

const props = defineProps<{
  options: Server[]
  value: number
}>()

const emit = defineEmits<{
  (e: 'change', v: string): void
}>()

const options = computed<ScalarListboxOption[]>(() =>
  props.options.map((server, index) => ({
    id: index.toString(),
    label: server.url ?? '',
  })),
)

const selected = computed<ScalarListboxOption | undefined>({
  get: () => options.value?.find((opt) => opt.id === props.value.toString()),
  set: (opt?: ScalarListboxOption) => emit('change', opt?.id ?? ''),
})
</script>
<template>
  <div class="w-full">
    <ScalarListbox
      v-model="selected"
      :options="options"
      resize>
      <ScalarButton
        class="url-select"
        :class="{ 'pointer-events-none': options.length <= 1 }"
        fullWidth
        variant="ghost">
        <span>
          <slot></slot>
        </span>
        <ScalarIcon
          v-if="options.length > 1"
          icon="ChevronDown"
          size="xs" />
      </ScalarButton>
    </ScalarListbox>
  </div>
</template>

<style scoped>
.url-select {
  padding: 10px 9px 9px 0;
  color: var(--scalar-color-1);
  align-items: center;
  display: flex;
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-regular);
  gap: 3px;
  height: auto;
  outline: none;
  width: 100%;
}
.url-select svg {
  color: var(--scalar-color-2);
  stroke-width: 1;
}
</style>
