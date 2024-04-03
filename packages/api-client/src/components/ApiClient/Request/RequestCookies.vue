<script setup lang="ts">
import { computed } from 'vue'

import { useRequestStore } from '../../../stores'
import type { GeneratedParameter } from '../../../types'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

const props = defineProps<{
  cookies?: any[]
  generatedCookies?: GeneratedParameter[]
}>()

const { activeRequest } = useRequestStore()

function handleDeleteIndex(index: number) {
  activeRequest.cookies?.splice(index, 1)
}

function addAnotherHandler() {
  if (activeRequest.cookies === undefined) {
    activeRequest.cookies = []
  }

  activeRequest.cookies?.push({ name: '', value: '', enabled: true })
}

const hasCookies = computed(() => {
  return !!(props.cookies?.length || props.generatedCookies?.length)
})
</script>
<template>
  <CollapsibleSection
    :defaultOpen="hasCookies"
    title="Cookies">
    <template v-if="!hasCookies">
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
          Cookies
        </button>
      </div>
    </template>
    <template v-else>
      <Grid
        addLabel="Cookie"
        :generatedItems="generatedCookies"
        :items="cookies"
        @addAnother="addAnotherHandler"
        @deleteIndex="handleDeleteIndex" />
    </template>
  </CollapsibleSection>
</template>
<style>
.scalar-api-client-add {
  color: var(--scalar-color-2);
  padding: 3px 9px;
  width: fit-content;
  cursor: pointer;
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-semibold);
  text-decoration: none;
  margin: 0 6px;
  border: none;
  font-family: var(--scalar-font);
  appearance: none;
  display: flex;
  align-items: center;
  border: 1px solid var(--scalar-border-color);
  border-radius: 30px;
}
.scalar-api-client-add svg {
  width: 12px;
  height: 12px;
  margin-right: 6px;
}
.scalar-api-client-add:hover {
  color: var(--scalar-color-1);
}
.scalar-api-client-add:focus-within {
  background: var(--scalar-background-3);
}
</style>
