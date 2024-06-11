<script setup lang="ts">
import type { ClientConfiguration } from '#@/types'
import '@scalar/client-app/style.css'
import { ScalarModal, type useModal } from '@scalar/components'
import '@scalar/components/style.css'
import { RouterView } from 'vue-router'

defineProps<{
  /** Controls opening and closing the modal */
  modalState: ReturnType<typeof useModal>
  /** The openapi spec config */
  // config: ClientConfiguration
}>()
</script>

<template>
  <ScalarModal
    bodyClass="row flex-1"
    size="full"
    :state="modalState">
    <RouterView key="$route.fullPath" />
  </ScalarModal>
</template>
