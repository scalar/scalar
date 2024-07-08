<script setup lang="ts">
import { ScalarButton } from '@scalar/components'

defineProps<{
  danger?: boolean
  label?: string
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit'): void
}>()
</script>
<template>
  <form
    class="flex flex-col gap-6 text-base"
    @submit.prevent="emit('submit')">
    <slot />
    <div class="flex justify-end gap-3">
      <ScalarButton
        variant="outlined"
        @click="emit('cancel')">
        Cancel
      </ScalarButton>
      <ScalarButton
        :error="danger"
        type="submit">
        {{ label ?? 'Submit' }}
      </ScalarButton>
    </div>
  </form>
</template>
