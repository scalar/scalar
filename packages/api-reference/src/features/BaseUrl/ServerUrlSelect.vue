<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import type { Server } from '@scalar/types/legacy'
import { computed } from 'vue'

const props = defineProps<{
  options: Server[]
  modelValue: number
  describedBy?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void
}>()

const options = computed<ScalarListboxOption[]>(() =>
  props.options.map((server, index) => ({
    id: index.toString(),
    label: server.url ?? '',
  })),
)

const selected = computed<ScalarListboxOption | undefined>({
  get: () =>
    options.value?.find((opt) => opt.id === props.modelValue.toString()),
  set: (opt?: ScalarListboxOption) =>
    emit('update:modelValue', parseInt(opt?.id ?? '', 10)),
})
</script>
<template>
  <ScalarListbox
    v-model="selected"
    class="text-sm"
    :options="options"
    resize
    teleport>
    <ScalarButton
      :aria-describedby="describedBy"
      class="url-select"
      :class="{ 'pointer-events-none': options.length <= 1 }"
      fullWidth
      variant="ghost">
      <span
        class="custom-scroll"
        tabindex="-1">
        <slot />
      </span>
      <ScalarIcon
        v-if="options.length > 1"
        icon="ChevronDown"
        size="xs" />
    </ScalarButton>
  </ScalarListbox>
</template>

<style scoped>
.url-select {
  padding: 0 9px;
  min-height: 32px;
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
.url-select span {
  display: flex;
  align-items: center;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.url-select span::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
.url-select svg {
  color: var(--scalar-color-2);
  stroke-width: 1;
}
</style>
