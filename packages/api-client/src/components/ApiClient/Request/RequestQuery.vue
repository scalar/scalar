<script setup lang="ts">
import { useApiClientRequestStore } from '../../../stores'
import type { Query } from '../../../types'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{ queries?: Query[] }>()

const { activeRequest } = useApiClientRequestStore()

function handleDeleteIndex(index: number) {
  activeRequest.query?.splice(index, 1)
}

function addAnotherHandler() {
  activeRequest.query?.push({ name: '', value: '' })
}
</script>
<template>
  <CollapsibleSection title="Query Parameters">
    <template v-if="!queries || queries.length === 0">
      <div class="scalar-api-client__empty-state">
        <button
          class="scalar-api-client-add"
          type="button"
          @click="addAnotherHandler">
          Add Query Parameter
        </button>
      </div>
    </template>
    <template v-else>
      <Grid
        addLabel="Query Parameter"
        :items="queries"
        @addAnother="addAnotherHandler"
        @deleteIndex="handleDeleteIndex" />
    </template>
  </CollapsibleSection>
</template>
