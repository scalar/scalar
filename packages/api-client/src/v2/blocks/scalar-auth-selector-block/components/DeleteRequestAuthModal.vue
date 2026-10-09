<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarModal } from '@scalar/components/modal'

import { useLocalization } from '@/v2/features/localization'

defineProps<{
  state: { open: boolean; show: () => void; hide: () => void }
  label: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

const { translate } = useLocalization()

const deleteScheme = () => {
  emit('delete')
}
</script>
<template>
  <ScalarModal
    size="xxs"
    :state="state"
    :title="translate('apiClient.deleteRequestAuthModal.deleteSecurityScheme')">
    <p class="text-c-2 mb-4 text-sm leading-normal">
      {{
        translate('apiClient.deleteRequestAuthModal.confirmation', {
          name: label,
        })
      }}
    </p>
    <div class="flex justify-between gap-2">
      <ScalarButton
        class="flex h-8 cursor-pointer items-center gap-1.5 px-3 shadow-none focus:outline-none"
        type="button"
        variant="outlined"
        @click="emit('close')">
        {{ translate('apiClient.deleteRequestAuthModal.cancel') }}
      </ScalarButton>
      <ScalarButton
        class="flex h-8 cursor-pointer items-center gap-1.5 px-3 shadow-none focus:outline-none"
        type="submit"
        @click="deleteScheme">
        {{ translate('apiClient.deleteRequestAuthModal.delete') }} {{ label }}
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
