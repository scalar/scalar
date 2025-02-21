<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarMarkdown,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { computed, ref } from 'vue'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CollectionServerForm from './CollectionServerForm.vue'

const { activeCollection } = useActiveEntities()
const { servers, events, serverMutators } = useWorkspace()

const deleteModal = useModal()
const selectedServerUid = ref<string | null>(null)

const collectionServers = computed(() =>
  Object.values(servers || {}).filter((server) =>
    activeCollection.value?.servers.includes(server.uid),
  ),
)

/** Add server */
const handleAddServer = () =>
  events.commandPalette.emit({
    commandName: 'Add Server',
  })

/** Delete server */
const handleDeleteServer = () => {
  if (!activeCollection.value?.uid || !selectedServerUid.value) return

  serverMutators.delete(selectedServerUid.value, activeCollection.value.uid)
  deleteModal.hide()
}

const openDeleteModal = (serverUid: string) => {
  selectedServerUid.value = serverUid
  deleteModal.show()
}
</script>

<template>
  <div
    class="mx-auto flex h-full w-full flex-col gap-12 px-1.5 py-8 md:max-h-[82dvh] md:max-w-[50dvw]">
    <div class="flex flex-col gap-4">
      <div class="flex items-start justify-between gap-2">
        <div class="flex flex-col gap-2">
          <h3 class="font-bold">Servers</h3>
          <p class="text-sm">
            Add different base URLs for your API. You can use
            <code class="font-code text-c-2">{variables}</code> for dynamic
            parts.
          </p>
        </div>
      </div>
      <div
        v-for="(server, index) in collectionServers"
        :key="server.uid">
        <div class="bg-b-2 overflow-hidden rounded-lg border">
          <div class="flex items-center justify-between py-1 pl-3 pr-1 text-sm">
            <ScalarMarkdown
              v-if="server.description"
              :value="server.description" />
            <span v-else>Server {{ index + 1 }}</span>
            <ScalarDropdown placement="bottom-end">
              <ScalarButton
                class="hover:bg-b-3 h-full max-h-8 gap-1 p-1 text-xs"
                variant="ghost">
                <ScalarIcon
                  class="text-c-3"
                  icon="Ellipses"
                  size="md" />
              </ScalarButton>
              <template #items>
                <ScalarDropdownItem
                  class="flex gap-2 font-normal"
                  @click="openDeleteModal(server.uid)">
                  <ScalarIcon
                    class="inline-flex"
                    icon="Delete"
                    size="sm"
                    thickness="1.5" />
                  <span>Delete</span>
                </ScalarDropdownItem>
              </template>
            </ScalarDropdown>
          </div>
          <CollectionServerForm
            v-if="activeCollection"
            :collectionId="activeCollection.uid"
            :serverUid="server.uid" />
        </div>
      </div>
      <div
        class="text-c-3 flex h-full items-center justify-center rounded-lg border p-4">
        <ScalarButton
          class="hover:bg-b-2 hover:text-c-1 flex items-center gap-2"
          variant="ghost"
          size="sm"
          @click="handleAddServer">
          <ScalarIcon
            class="inline-flex"
            icon="Add"
            size="sm"
            thickness="1.5" />
          <span>Add Server</span>
        </ScalarButton>
      </div>
    </div>
    <ScalarModal
      :size="'xxs'"
      :state="deleteModal"
      :title="`Delete ${selectedServerUid ? servers[selectedServerUid]?.url : 'Server'}`">
      <DeleteSidebarListElement
        :variableName="'Server'"
        :warningMessage="'Are you sure you want to delete this server? This action cannot be undone.'"
        @close="deleteModal.hide()"
        @delete="handleDeleteServer" />
    </ScalarModal>
  </div>
</template>
