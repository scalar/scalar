<script lang="ts" setup>
import { nextTick, ref } from 'vue'

import DropEventListener from './DropEventListener.vue'
import ImportCollectionModal from './ImportCollectionModal.vue'
import PasteEventListener from './PasteEventListener.vue'
import UrlQueryParameterChecker from './UrlQueryParameterChecker.vue'

/** Source to import from */
const source = ref<string | null>(null)

const integration = ref<string | null>(null)

const eventType = ref<'paste' | 'drop' | 'query' | null>(null)

/** Reset the data when the modal was closed */
async function resetData() {
  source.value = null
  integration.value = null
  eventType.value = null

  await nextTick()
}

/** Receive data from the paste event listener */
async function handleInput(
  newSource: string,
  newIntegration: string | null = null,
  newEventType: 'paste' | 'drop' | 'query',
) {
  // Reset, to trigger the modal to reopen
  await resetData()

  source.value = newSource
  integration.value = newIntegration
  eventType.value = newEventType
}
</script>

<template>
  <!-- Modal -->
  <ImportCollectionModal
    :eventType="eventType"
    :integration="integration"
    :source="source"
    @importFinished="resetData" />

  <!-- Event listeners-->
  <PasteEventListener @input="handleInput" />
  <DropEventListener @input="handleInput" />
  <UrlQueryParameterChecker @input="handleInput" />

  <!-- Wrapped content -->
  <slot />
</template>
