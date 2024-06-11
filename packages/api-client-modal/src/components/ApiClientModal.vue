<script setup lang="ts">
import type { ClientConfiguration } from '#@/types'
import { ScalarClientRequest } from '@scalar/client-app'
import '@scalar/client-app/style.css'
import { ScalarModal, type useModal } from '@scalar/components'
import '@scalar/components/style.css'

defineProps<{
  /** Controls opening and closing the modal */
  modalState: ReturnType<typeof useModal>
  /** The openapi spec config */
  // config: ClientConfiguration
}>()
</script>

<template>
  <ScalarModal
    size="full"
    :state="modalState">
    <ScalarClientRequest />
  </ScalarModal>
</template>
