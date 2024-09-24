<script lang="ts" setup>
import { nextTick, ref } from 'vue'

import DropEventListener from './DropEventListener.vue'
import ImportCollectionModal from './ImportCollectionModal.vue'
import PasteEventListener from './PasteEventListener.vue'
import UrlQueryParameterChecker from './UrlQueryParameterChecker.vue'

/** Source to import from */
const input = ref<string | null>(null)
/** Title for the source (optional) */
const title = ref<string | null>(null)

/** Reset the data when the modal was closed */
async function resetData() {
  title.value = null
  input.value = null
  await nextTick()
}

/** Receive data from the paste event listener */
async function handleInput(newInput: string, newTitle?: string | null) {
  // Reset, to trigger the modal to reopen
  await resetData()

  input.value = newInput

  if (newTitle) {
    title.value = newTitle
  }
}
</script>

<template>
  <!-- Modal -->
  <ImportCollectionModal
    :input="input"
    :title="title"
    @importFinished="resetData" />

  <!-- Event listeners-->
  <PasteEventListener @input="handleInput" />
  <DropEventListener @input="handleInput" />
  <UrlQueryParameterChecker @input="handleInput" />

  <!-- Wrapped content -->
  <slot />
</template>
