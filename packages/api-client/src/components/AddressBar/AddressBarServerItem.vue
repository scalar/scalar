<script lang="ts">
export type ServerOption = { id: string; label: string }
</script>
<script setup lang="ts">
import { useWorkspace } from '@/store'
import { ScalarDropdownItem, ScalarIcon } from '@scalar/components'

const props = defineProps<{
  serverOption: ServerOption
  type: 'collection' | 'request'
}>()

const {
  activeCollection,
  activeRequest,
  activeServer,
  collectionMutators,
  requestMutators,
} = useWorkspace()

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
    class="flex !gap-1.5 group font-code text-xxs whitespace-nowrap text-ellipsis overflow-hidden"
    :value="serverOption.id"
    @click="updateSelectedServer(serverOption.id)">
    <div
      class="flex size-4 items-center justify-center rounded-full p-[3px]"
      :class="
        isSelectedServer(serverOption.id)
          ? 'bg-c-accent text-b-1'
          : 'group-hover:shadow-border text-transparent'
      ">
      <ScalarIcon
        class="relative top-[0.5px] size-2.5"
        icon="Checkmark"
        thickness="3.5" />
    </div>
    <span class="whitespace-nowrap text-ellipsis overflow-hidden">
      {{ serverOption.label }}
    </span>
  </ScalarDropdownItem>
</template>
