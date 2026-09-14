<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'

import { useLocalization } from '@/v2/features/localization'

const { label, variant = 'solid' } = defineProps<{
  /** The label of the submit button */
  label?: string
  /** Sets the style of the submit button */
  variant?: 'danger' | 'solid'
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit'): void
}>()

const { translate } = useLocalization()
</script>
<template>
  <form
    class="flex flex-col gap-4 text-base"
    @submit.prevent="emit('submit')">
    <slot />

    <div class="flex justify-between gap-10">
      <!-- Cancel -->
      <ScalarButton
        size="sm"
        type="button"
        variant="outlined"
        @click="emit('cancel')">
        {{ translate('apiClient.confirmationForm.cancel') }}
      </ScalarButton>

      <!-- Submit -->
      <ScalarButton
        size="sm"
        type="submit"
        :variant="variant">
        {{ label ?? translate('apiClient.confirmationForm.save') }}
      </ScalarButton>
    </div>
  </form>
</template>
