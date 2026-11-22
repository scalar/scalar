<script lang="ts">
/**
 * Invites developers to the API Hosting beta the way the API client does, once on each local host
 * name, with the Deploy panel's waitlist card. Only the localhost shell mounts it, and only for a
 * development server on this machine; `useApiHostingBetaPrompt` decides when it opens.
 *
 * The dialog is mounted only while it is up. Headless UI's `Dialog` leaves a hidden node in place even
 * when it is closed, and the shell's grid should hold exactly what it held before the popup, and
 * again after it.
 */
export default {}
</script>

<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import { useApiHostingBetaPrompt } from '../hooks/use-api-hosting-beta-prompt'
import ApiHostingBetaDialog from './ApiHostingBetaDialog.vue'

const { integration, ready = true } = defineProps<{
  /** The framework serving the reference, set by the Scalar integrations */
  integration?: ApiReferenceConfiguration['_integration']
  /**
   * Whether the reference has finished its heavy loading work. Until then the popup does not open,
   * though it already notices someone starting to read.
   */
  ready?: boolean
}>()

const { isOpen, close } = useApiHostingBetaPrompt(() => ready)
</script>

<template>
  <ApiHostingBetaDialog
    v-if="isOpen"
    :integration
    @close="close" />
</template>
