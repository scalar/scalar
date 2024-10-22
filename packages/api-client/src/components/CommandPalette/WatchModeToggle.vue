<script setup lang="ts">
import { ScalarIcon, ScalarToggle, ScalarTooltip } from '@scalar/components'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
  disableToolTip?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <ScalarTooltip
    as="div"
    class="z-[10001]"
    :disabled="disableToolTip"
    side="bottom"
    :sideOffset="5">
    <template #trigger>
      <label
        class="p-3 py-1.5 rounded flex items-center text-sm text-c-2 gap-2 select-none"
        :class="disabled ? 'cursor-default' : 'cursor-pointer'"
        for="watch-toggle">
        <span
          class="text-c-1 flex gap-1 items-center font-medium text-xs"
          :class="{ 'text-c-3': !modelValue }">
          <ScalarIcon
            icon="Watch"
            size="sm" />
          Watch Mode
        </span>
        <ScalarToggle
          id="watch-toggle"
          :disabled="disabled"
          :modelValue="modelValue"
          @update:modelValue="(value) => emit('update:modelValue', value)" />
      </label>
    </template>
    <template #content>
      <div
        class="grid gap-1.5 pointer-events-none max-w-[320px] w-content shadow-lg rounded bg-b-1 z-100 p-2 text-xxs leading-5 z-10 text-c-1">
        <div class="flex items-center text-c-2">
          <span v-if="disabled"> Watch Mode is only supported for URLs </span>
          <span
            v-else
            class="text-pretty">
            Watch your OpenAPI URL for changes. Enabled it will update the API
            client for you.
          </span>
        </div>
      </div>
    </template>
  </ScalarTooltip>
</template>
