<script setup lang="ts">
import ServerVariablesForm from '@/components/Server/ServerVariablesForm.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarListboxCheckbox, ScalarMarkdown } from '@scalar/components'
import { computed, useId } from 'vue'

const props = defineProps<{
  serverOption: { id: string; label: string }
  type: 'collection' | 'request'
  layout?: 'client' | 'reference'
}>()

const emit = defineEmits<{
  (e: 'update:variable', key: string, value: string): void
}>()

const formId = useId()

const { activeCollection, activeRequest, activeServer } = useActiveEntities()
const { collectionMutators, requestMutators } = useWorkspace()

/** Update the currently selected server on the collection or request */
const updateSelectedServer = (serverUid: string) => {
  if (props.type === 'collection' && activeCollection.value) {
    // Clear the selected server on the request so that the collection can be updated
    if (activeRequest.value?.servers?.length) {
      activeRequest.value.selectedServerUid = ''
    }
    collectionMutators.edit(
      activeCollection.value.uid,
      'selectedServerUid',
      serverUid,
    )
  } else if (props.type === 'request' && activeRequest.value) {
    requestMutators.edit(
      activeRequest.value.uid,
      'selectedServerUid',
      serverUid,
    )
  }
}

/** Set server checkbox in the dropdown */
const isSelectedServer = computed(
  () => activeServer.value?.uid === props.serverOption.id,
)

const hasVariables = computed(
  () =>
    activeServer.value?.variables &&
    Object.keys(activeServer.value.variables).length > 0,
)

const isExpanded = computed(() => isSelectedServer.value && hasVariables.value)

const updateServerVariable = (key: string, value: string) => {
  emit('update:variable', key, value)
}
</script>
<template>
  <div
    class="min-h-fit rounded flex flex-col border group/item"
    :class="{ 'border-transparent': !isSelectedServer }">
    <button
      :aria-controls="isExpanded ? formId : undefined"
      :aria-expanded="isExpanded"
      class="cursor-pointer rounded flex items-center gap-1.5 min-h-8 px-1.5"
      :class="isSelectedServer ? 'text-c-1 bg-b-2' : 'hover:bg-b-2'"
      type="button"
      @click.stop="updateSelectedServer(serverOption.id)">
      <ScalarListboxCheckbox :selected="isSelectedServer" />
      <span class="whitespace-nowrap text-ellipsis overflow-hidden">
        {{ serverOption.label }}
      </span>
    </button>
    <!-- Server variables -->
    <div
      v-if="isExpanded && layout !== 'reference'"
      :id="formId"
      class="bg-b-2 border-t divide divide-y *:pl-4 rounded-b">
      <ServerVariablesForm
        :variables="activeServer?.variables"
        @update:variable="updateServerVariable" />
      <!-- Description -->
      <div v-if="activeServer?.description">
        <div class="description px-3 py-1.5 text-c-3">
          <ScalarMarkdown :value="activeServer.description" />
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
