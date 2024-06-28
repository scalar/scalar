<script setup lang="ts">
import {
  ScalarModal,
  addScalarClassesToHeadless,
  type useModal,
} from '@scalar/components'
import { onBeforeMount } from 'vue'
import { RouterView } from 'vue-router'

defineProps<{
  /** Controls opening and closing the modal */
  modalState: ReturnType<typeof useModal>
}>()

/**
 * Ensure we add our scalar wrapper class to the headless ui root
 * mounted is too late
 */
onBeforeMount(() => addScalarClassesToHeadless())
</script>

<template>
  <ScalarModal
    bodyClass="h-full"
    size="full"
    :state="modalState">
    <RouterView key="$route.fullPath" />
  </ScalarModal>
</template>

<style>
@import '@scalar/components/style.css';
@import '@/assets/tailwind.css';
@import '@/assets/variables.css';
</style>
