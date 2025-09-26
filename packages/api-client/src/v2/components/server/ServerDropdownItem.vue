<script setup lang="ts">
import { ScalarListboxCheckbox, ScalarMarkdown } from '@scalar/components'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, useId } from 'vue'

import ServerVariablesForm from '@/components/Server/ServerVariablesForm.vue'

const { server, serverOption } = defineProps<{
  server: ServerObject | undefined
  serverOption: {
    id: string
    label: string
  }
}>()

const emit = defineEmits<{
  /** Update a server variable for the selected server */
  (e: 'update:variable', key: string, value: string): void
  /** Update selected server by id => server url */
  (e: 'update:selectedServer', payload: { id: string }): void
}>()

const formId = useId()

const hasVariables = () => {
  return Object.keys(server?.variables ?? {}).length > 0
}

const isSelectedServer = computed(() => serverOption.id === server?.url)

const isExpanded = computed(() => isSelectedServer.value && hasVariables())

const updateServerVariable = (key: string, value: string) => {
  emit('update:variable', key, value)
}
</script>
<template>
  <div
    class="group/item flex min-h-fit flex-col rounded border"
    :class="{ 'border-transparent': !isSelectedServer }">
    <button
      v-bind="isExpanded ? { 'aria-controls': formId } : {}"
      :aria-expanded="isExpanded"
      class="flex min-h-8 cursor-pointer items-center gap-1.5 rounded px-1.5"
      :class="isSelectedServer ? 'text-c-1 bg-b-2' : 'hover:bg-b-2'"
      type="button"
      @click="emit('update:selectedServer', { id: serverOption.id })">
      <ScalarListboxCheckbox :selected="isSelectedServer" />
      <span class="overflow-hidden text-ellipsis whitespace-nowrap">
        {{ serverOption.label }}
      </span>
    </button>
    <!-- Server variables -->
    <div
      v-if="isExpanded"
      :id="formId"
      class="bg-b-2 divide divide-y rounded-b border-t *:pl-4"
      @click.stop>
      <ServerVariablesForm
        :variables="server?.variables"
        @update:variable="updateServerVariable" />
      <!-- Description -->
      <div v-if="server?.description">
        <div class="description text-c-3 px-3 py-1.5">
          <ScalarMarkdown :value="server.description" />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.description :deep(.markdown) {
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color--1);
  padding: 0 0;
  display: block;
}
.description :deep(.markdown > *:first-child) {
  margin-top: 0;
}
</style>
