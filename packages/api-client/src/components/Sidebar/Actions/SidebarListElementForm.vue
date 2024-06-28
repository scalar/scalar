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
    class="flex flex-col gap-3"
    @submit.prevent="emit('submit')">
    <slot />
    <div class="flex gap-3">
      <ScalarButton
        class="flex-1"
        variant="outlined"
        @click="emit('cancel')">
        Cancel
      </ScalarButton>
      <ScalarButton
        class="flex-1"
        :error="danger"
        type="submit">
        {{ label ?? 'Submit' }}
      </ScalarButton>
    </div>
  </form>
</template>
