<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarModal, type ModalState } from '@scalar/components/modal'

import { useLocalization } from '@/v2/features/localization'

const { state, name = 'unknown' } = defineProps<{
  state: ModalState
  name: string | null
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (event: 'submit'): void
}>()

const { translate } = useLocalization()
</script>

<template>
  <ScalarModal
    bodyClass="border-t-0 rounded-t-lg flex flex-col gap-4"
    size="xxs"
    :state="state"
    :title="
      translate('apiClient.environmentDeleteModal.title', { name: name ?? '' })
    ">
    <p class="text-c-2 text-sm leading-normal text-pretty">
      {{ translate('apiClient.environmentDeleteModal.deleteConfirmation') }}
    </p>
    <div class="flex justify-between">
      <ScalarButton
        size="sm"
        variant="outlined"
        @click="
          () => {
            emit('cancel')
            state.hide()
          }
        ">
        {{ translate('apiClient.environmentDeleteModal.cancel') }}
      </ScalarButton>
      <ScalarButton
        size="sm"
        variant="danger"
        @click="
          () => {
            emit('submit')
            state.hide()
          }
        ">
        {{ translate('apiClient.environmentDeleteModal.deleteEnvironment') }}
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
