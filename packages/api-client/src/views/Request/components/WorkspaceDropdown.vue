<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarListboxCheckbox,
  ScalarModal,
  useModal,
} from '@scalar/components'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import EditSidebarListElement from '@/components/Sidebar/Actions/EditSidebarListElement.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const { activeWorkspace } = useActiveEntities()
const { workspaces, workspaceMutators, events } = useWorkspace()
const { push } = useRouter()

const updateSelected = (uid: Workspace['uid']) => {
  if (uid === activeWorkspace.value?.uid) {
    return
  }

  push({
    name: 'workspace',
    params: {
      workspace: uid,
    },
  })
}

const isLastWorkspace = computed(() => Object.keys(workspaces).length === 1)

const createNewWorkspace = () =>
  events.commandPalette.emit({ commandName: 'Create Workspace' })

const tempName = ref('')
const tempUid = ref('' as Workspace['uid'])
const editModal = useModal()
const deleteModal = useModal()

const openRenameModal = (uid: Workspace['uid']) => {
  const workspace = workspaces[uid]
  if (!workspace) {
    return
  }

  tempName.value = workspace.name
  tempUid.value = uid
  editModal.show()
}

const handleWorkspaceEdit = (name: string) => {
  if (!name.trim()) {
    return
  }

  workspaceMutators.edit(tempUid.value, 'name', name.trim())
  editModal.hide()
}

const openDeleteModal = (uid: Workspace['uid']) => {
  const workspace = workspaces[uid]
  if (!workspace) {
    return
  }

  tempName.value = workspace.name
  tempUid.value = uid
  deleteModal.show()
}

const deleteWorkspace = async () => {
  if (!isLastWorkspace.value) {
    const deletedActiveWorkspace = activeWorkspace.value?.uid === tempUid.value
    const currentWorkspaces = { ...workspaces }
    delete currentWorkspaces[tempUid.value]

    workspaceMutators.delete(tempUid.value)

    // Switch to another workspace if the active one is deleted
    if (deletedActiveWorkspace) {
      const newWorkspaceUid = Object.keys(currentWorkspaces)[0]

      await push({
        name: 'workspace',
        params: {
          workspace: newWorkspaceUid,
        },
      })
    }
  }

  deleteModal.hide()
}
</script>

<template>
  <div>
    <div class="flex w-[inherit] items-center text-base">
      <ScalarDropdown>
        <ScalarButton
          class="text-c-1 hover:bg-b-2 line-clamp-1 h-full w-fit justify-start px-1.5 py-1.5 font-normal"
          fullWidth
          variant="ghost">
          <div class="m-0 flex items-center gap-1.5 font-bold">
            <h2 class="line-clamp-1 text-left">
              {{ activeWorkspace?.name }}
            </h2>
          </div>
        </ScalarButton>

        <!-- Workspace list -->
        <template #items>
          <ScalarDropdownItem
            v-for="(workspace, uid) in workspaces"
            :key="uid"
            class="group/item flex w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
            @click.stop="updateSelected(workspace.uid)">
            <ScalarListboxCheckbox :selected="activeWorkspace?.uid === uid" />
            <span class="overflow-hidden text-ellipsis">{{
              workspace.name
            }}</span>
            <ScalarDropdown
              placement="right-start"
              teleport>
              <ScalarButton
                class="hover:bg-b-3 -mr-1 ml-auto aspect-square h-fit px-0.5 py-0 group-hover/item:flex"
                size="sm"
                type="button"
                variant="ghost">
                <ScalarIcon
                  icon="Ellipses"
                  size="sm" />
              </ScalarButton>
              <template #items>
                <ScalarDropdownItem
                  class="flex gap-2"
                  @mousedown="openRenameModal(workspace.uid)"
                  @touchend.prevent="openRenameModal(workspace.uid)">
                  <ScalarIcon
                    class="inline-flex"
                    icon="Edit"
                    size="md"
                    thickness="1.5" />
                  <span>Rename</span>
                </ScalarDropdownItem>
                <ScalarDropdownItem
                  v-if="!isLastWorkspace"
                  class="flex gap-2"
                  @mousedown.prevent="openDeleteModal(workspace.uid)"
                  @touchend.prevent="openDeleteModal(workspace.uid)">
                  <ScalarIcon
                    class="inline-flex"
                    icon="Delete"
                    size="md"
                    thickness="1.5" />
                  <span>Delete</span>
                </ScalarDropdownItem>
              </template>
            </ScalarDropdown>
          </ScalarDropdownItem>
          <ScalarDropdownDivider />

          <!-- Add new workspace -->
          <ScalarDropdownItem
            class="flex items-center gap-1.5"
            @click="createNewWorkspace">
            <div class="flex h-4 w-4 items-center justify-center">
              <ScalarIcon
                icon="Add"
                size="sm" />
            </div>
            <span>Create Workspace</span>
          </ScalarDropdownItem>
        </template>
      </ScalarDropdown>
    </div>
    <ScalarModal
      :size="'xxs'"
      :state="deleteModal"
      title="Delete workspace">
      <DeleteSidebarListElement
        :variableName="tempName"
        warningMessage="This cannot be undone. You're about to delete the workspace and everything inside it."
        @close="deleteModal.hide()"
        @delete="deleteWorkspace" />
    </ScalarModal>
    <ScalarModal
      :size="'xxs'"
      :state="editModal"
      title="Rename Workspace">
      <EditSidebarListElement
        :name="tempName"
        @close="editModal.hide()"
        @edit="handleWorkspaceEdit" />
    </ScalarModal>
  </div>
</template>
