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
    class="flex flex-col gap-4 text-base"
    @submit.prevent="emit('submit')">
    <slot />
    <div class="flex justify-between gap-10">
      <ScalarButton
        size="sm"
        type="button"
        variant="outlined"
        @click="emit('cancel')">
        Cancel
      </ScalarButton>
      <ScalarButton
        data-testid="sidebar-list-element-form-submit-button"
        size="sm"
        type="submit"
        :variant="danger ? 'danger' : 'solid'">
        {{ label ?? 'Save' }}
      </ScalarButton>
    </div>
  </form>
</template>
