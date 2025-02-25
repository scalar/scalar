<script setup lang="ts">
import {
  ScalarButton,
  useBindCx,
  type useLoadingState,
} from '@scalar/components'

const { loading, disabled = false } = defineProps<{
  loading?: ReturnType<typeof useLoadingState>
  disabled?: boolean
}>()

defineEmits<{
  (event: 'submit'): void
  (event: 'cancel'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { cx } = useBindCx()
</script>
<template>
  <form
    class="flex w-full flex-col gap-3"
    @keydown.enter.stop
    @submit.prevent.stop="$emit('submit')">
    <div v-bind="cx('relative flex min-h-20 flex-col rounded')">
      <slot />
    </div>
    <div class="flex gap-2">
      <div class="flex max-h-8 flex-1">
        <slot name="options" />
      </div>
      <ScalarButton
        class="max-h-8 p-0 px-3 text-xs"
        :disabled="disabled"
        :loading="loading"
        type="submit">
        <slot name="submit">Continue</slot>
      </ScalarButton>
    </div>
  </form>
</template>
