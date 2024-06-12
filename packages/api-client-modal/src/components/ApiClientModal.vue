<script setup lang="ts">
import '@scalar/client-app/style.css'
import { ScalarModal, type useModal } from '@scalar/components'
import '@scalar/components/style.css'
import { RouterView } from 'vue-router'

defineProps<{
  /** Controls opening and closing the modal */
  modalState: ReturnType<typeof useModal>
}>()
</script>

<template>
  <ScalarModal
    bodyClass="h-full"
    size="full"
    :state="modalState">
    <RouterView key="$route.fullPath" />
  </ScalarModal>
</template>
