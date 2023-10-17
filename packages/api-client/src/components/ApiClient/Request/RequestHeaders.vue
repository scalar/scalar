<script setup lang="ts">
import { useApiClientRequestStore } from '../../../stores'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{ headers?: any[] }>()

const { activeRequest } = useApiClientRequestStore()

function handleDeleteIndex(index: number) {
  activeRequest.headers?.splice(index, 1)
}

function addAnotherHandler() {
  activeRequest.headers?.push({ name: '', value: '' })
}
</script>
<template>
  <CollapsibleSection title="Headers">
    <template v-if="!headers || headers.length === 0">
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
        :items="headers"
        @addAnother="addAnotherHandler"
        @deleteIndex="handleDeleteIndex" />
    </template>
  </CollapsibleSection>
</template>
<style>
.scalar-api-client-add {
  color: var(--theme-color-2, var(--default-theme-color-2));
  padding: 6px;
  width: fit-content;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  cursor: pointer;
  font-size: var(--theme-micro, var(--default-theme-micro));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin: 0 6px;
  font-family: var(--theme-font);
  appearance: none;
  display: flex;
  align-items: center;
}
.scalar-api-client-add svg {
  width: 12px;
  height: 12px;
  margin-right: 6px;
}
.scalar-api-client-add:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>
