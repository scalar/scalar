<script setup lang="ts">
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const { activeWorkspace } = useActiveEntities()
const { workspaces, workspaceMutators } = useWorkspace()
const { push } = useRouter()

const modal = useModal()
const { toast } = useToasts()
const workspaceName = ref('')

const updateSelected = (uid: string) => {
  if (uid === activeWorkspace.value?.uid) return

  push({
    name: 'workspace',
    params: {
      workspace: uid,
    },
  })
}

const handleCreateWorkspace = () => {
  if (!workspaceName.value.trim()) {
    toast('Please enter a name before creating a workspace.', 'error')
    return
  }

  const newWorkspace = workspaceMutators.add({
    name: workspaceName.value,
  })

  toast(`Created new workspace '${newWorkspace.name}'`)

  push({
    name: 'workspace',
    params: {
      workspace: newWorkspace.uid,
    },
  })

  workspaceName.value = ''
  modal.hide()
}
</script>
<template>
  <div class="flex items-center text-sm w-[inherit]">
    <ScalarDropdown>
      <ScalarButton
        class="font-normal h-full justify-start line-clamp-1 py-1 px-1.5 text-c-1 hover:bg-b-2 w-fit text-c-3"
        fullWidth
        variant="ghost">
        <div class="font-medium m-0 text-sm flex gap-1 items-center">
          <h2 class="line-clamp-1 text-left w-[calc(100%-10px)] text-xs">
            {{ activeWorkspace?.name }}
          </h2>
          <ScalarIcon
            icon="ChevronDown"
            size="md" />
        </div>
      </ScalarButton>

      <!-- Workspace list -->
      <template #items>
        <ScalarDropdownItem
          v-for="(workspace, uid) in workspaces"
          :key="uid"
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden w-full"
          @click.stop="updateSelected(uid)">
          <div
            class="flex items-center justify-center rounded-full p-[3px] w-4 h-4"
            :class="
              activeWorkspace?.uid === uid
                ? 'bg-c-accent text-b-1'
                : 'shadow-border text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3" />
          </div>
          <span class="text-ellipsis overflow-hidden">{{
            workspace.name
          }}</span>
        </ScalarDropdownItem>
        <ScalarDropdownDivider />

        <!-- Add new workspace -->
        <ScalarDropdownItem
          class="flex items-center gap-1.5"
          @click="modal.show()">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              icon="Add"
              size="sm" />
          </div>
          <span>New Workspace</span>
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>
  </div>
  <ScalarModal
    bodyClass="m-0 p-1 rounded-lg border-t-0"
    class="absolute z-overlay"
    :size="'xxs'"
    :state="modal"
    variant="form">
    <form
      class="flex gap-1"
      @submit.prevent="handleCreateWorkspace">
      <input
        v-model="workspaceName"
        class="border-none outline-none flex-1 w-full text-sm min-h-8 p-1.5"
        placeholder="New Workspace"
        type="text" />
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        :disabled="!workspaceName.trim()"
        type="submit">
        Continue
      </ScalarButton>
    </form>
  </ScalarModal>
</template>
