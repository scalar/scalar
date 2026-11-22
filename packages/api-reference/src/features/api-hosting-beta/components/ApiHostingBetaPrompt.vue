<script lang="ts">
/**
 * Invites developers to the API Hosting beta the way the API client does, once on each local host
 * name. Only the localhost shell mounts it, so a hosted reference never shows it;
 * `useApiHostingBetaPrompt` decides when it opens.
 *
 * The dialog is mounted only while it is up. Headless UI's `Dialog` leaves a hidden node in place even
 * when it is closed, and the shell's grid should hold exactly what it held before the popup, and
 * again after it.
 */
export default {}
</script>

<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { computed } from 'vue'

import { getServerFramework } from '@/features/developer-tools/server-frameworks'

import { useApiHostingBetaPrompt } from '../hooks/use-api-hosting-beta-prompt'
import ApiHostingBetaDialog from './ApiHostingBetaDialog.vue'

const { integration } = defineProps<{
  /** The framework serving the reference, set by the Scalar integrations */
  integration?: ApiReferenceConfiguration['_integration']
}>()

const { isOpen, close } = useApiHostingBetaPrompt()

/** What the reference runs on, so joining sends it without anyone having to pick it. */
const framework = computed<string | undefined>(
  () => getServerFramework(integration)?.name,
)
</script>

<template>
  <ApiHostingBetaDialog
    v-if="isOpen"
    :framework
    open
    @close="close" />
</template>
