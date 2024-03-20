<script setup lang="ts">
import type { BaseParameter } from '@scalar/oas-utils'
import { computed } from 'vue'

import { useRequestStore } from '../../../stores'
import type { GeneratedParameter } from '../../../types'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

const props = defineProps<{
  headers?: BaseParameter[]
  generatedHeaders?: GeneratedParameter[]
}>()

const { activeRequest } = useRequestStore()

function handleDeleteIndex(index: number) {
  activeRequest.headers?.splice(index, 1)
}

function addAnotherHandler() {
  if (activeRequest.headers === undefined) {
    activeRequest.headers = []
  }

  activeRequest.headers?.push({ name: '', value: '', enabled: true })
}

const hasHeaders = computed(() => {
  return !!(props.headers?.length || props.generatedHeaders?.length)
})
</script>
<template>
  <CollapsibleSection
    :defaultOpen="hasHeaders"
    title="Headers">
    <template v-if="!hasHeaders">
      <div class="scalar-api-client__empty-state">
        <button
          class="scalar-api-client-add"
          type="button"
          @click="addAnotherHandler">
          <svg
            class="flow-icon"
            data-v-aa4fbd2d=""
            height="100%"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 1.714v44.572M1.714 24h44.572"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3.429"
              xmlns="http://www.w3.org/2000/svg"></path>
          </svg>
          Headers
        </button>
      </div>
    </template>
    <template v-else>
      <Grid
        addLabel="Header"
        :generatedItems="generatedHeaders"
        :items="headers"
        @addAnother="addAnotherHandler"
        @deleteIndex="handleDeleteIndex" />
    </template>
  </CollapsibleSection>
</template>
