<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarModal, type ModalState } from '@scalar/components/modal'

import { useLocalization } from '@/features/localization'

const { state } = defineProps<{ state: ModalState }>()
const emit = defineEmits<{ confirm: [] }>()
const { translate } = useLocalization()

const confirm = (): void => {
  state.hide()
  emit('confirm')
}
</script>

<template>
  <ScalarModal
    size="xs"
    :state
    :title="translate('developerTools.confirmShareTitle')">
    <p class="text-c-2 text-sm leading-normal">
      {{ translate('developerTools.confirmShareDescription') }}
    </p>
    <p class="text-c-2 mt-2 text-sm leading-normal">
      {{ translate('developerTools.temporaryLinkExpiration') }}
    </p>
    <div class="mt-4 flex justify-end gap-2">
      <ScalarButton
        variant="outlined"
        @click="state.hide()">
        {{ translate('developerTools.cancelShare') }}
      </ScalarButton>
      <ScalarButton @click="confirm">
        {{ translate('developerTools.confirmShare') }}
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
