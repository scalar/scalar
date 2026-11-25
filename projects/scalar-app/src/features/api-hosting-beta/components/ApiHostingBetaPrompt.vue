<script lang="ts">
/**
 * Invites each API client user to the API Hosting beta, once. Mounted once in the app shell;
 * `useApiHostingBetaPrompt` decides when it opens.
 */
export default {}
</script>

<script setup lang="ts">
import { computed } from 'vue'

import { useAuth } from '@/hooks/use-auth'

import { useApiHostingBetaPrompt } from '../hooks/use-api-hosting-beta-prompt'
import ApiHostingBetaDialog from './ApiHostingBetaDialog.vue'

const { fetch: sendRequest } = defineProps<{
  /**
   * Sends the sign-up in place of the browser's fetch. The desktop app passes the fetch that runs
   * in its main process.
   */
  fetch?: typeof fetch
}>()

const { tokenData } = useAuth()
const { isOpen, close } = useApiHostingBetaPrompt()

/** The logged-in account's address, so joining takes one click. */
const accountEmail = computed<string | undefined>(
  () => tokenData.value?.email ?? undefined,
)
</script>

<template>
  <ApiHostingBetaDialog
    :email="accountEmail"
    :fetch="sendRequest"
    :open="isOpen"
    @close="close" />
</template>
