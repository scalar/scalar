<script lang="ts">
export type ServerOption = { id: string; label: string }
</script>
<script setup lang="ts">
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarDropdownItem, ScalarIcon } from '@scalar/components'

const props = defineProps<{
  serverOption: ServerOption
  type: 'collection' | 'request'
}>()

const { activeCollection, activeRequest, activeServer } = useActiveEntities()
const { collectionMutators, requestMutators } = useWorkspace()

/** Update the currently selected server on the collection or request */
const updateSelectedServer = (serverUid: string) => {
  if (props.type === 'collection' && activeCollection.value) {
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
const isSelectedServer = (serverId: string) =>
  activeServer.value?.uid === serverId
</script>

<template>
  <ScalarDropdownItem
    key="serverOption.id"
    class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden w-full"
    :value="serverOption.id"
    @click="updateSelectedServer(serverOption.id)">
    <div
      class="flex size-4 items-center justify-center p-0.75 text-b-1 rounded-full"
      :class="
        isSelectedServer(serverOption.id)
          ? 'bg-c-accent text-b-1'
          : 'group-hover/item:shadow-border text-transparent'
      ">
      <ScalarIcon
        icon="Checkmark"
        size="xs"
        thickness="2.5" />
    </div>
    <span class="whitespace-nowrap text-ellipsis overflow-hidden">
      {{ serverOption.label }}
    </span>
  </ScalarDropdownItem>
</template>
