<script setup lang="ts">
import { useApiClientRequestStore } from '../../../stores'
import type { BaseParameter } from '../../../types'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{ variables?: BaseParameter[] }>()

const { activeRequest } = useApiClientRequestStore()

function handleDeleteIndex(index: number) {
  activeRequest.parameters?.splice(index, 1)
}

function addAnotherHandler() {
  activeRequest.parameters?.push({ name: '', value: '' })
}
</script>
<template>
  <CollapsibleSection title="Variables">
    <template v-if="!variables || variables.length === 0">
      <div class="scalar-api-client__empty-state">
        <button
          class="scalar-api-client-add"
          type="button"
          @click="addAnotherHandler">
          Add Variable
        </button>
      </div>
    </template>
    <template v-else>
      <Grid
        addLabel="Variable"
        :items="variables"
        @addAnother="addAnotherHandler"
        @deleteIndex="handleDeleteIndex" />
    </template>
  </CollapsibleSection>
</template>
