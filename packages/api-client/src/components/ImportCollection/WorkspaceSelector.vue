<script setup lang="ts">
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

import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const { activeWorkspace } = useActiveEntities()
const { workspaces, workspaceMutators } = useWorkspace()
const { push } = useRouter()

const modal = useModal()
const { toast } = useToasts()
const workspaceName = ref('')

const updateSelected = (uid: string) => {
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
  <div class="flex w-[inherit] items-center text-base">
    <ScalarDropdown>
      <ScalarButton
        class="text-c-1 hover:bg-b-2 text-c-3 line-clamp-1 h-full w-fit justify-start px-1.5 py-1 font-normal"
        fullWidth
        variant="ghost">
        <div class="m-0 flex items-center gap-1 text-sm font-medium">
          <h2 class="line-clamp-1 w-[calc(100%-10px)] text-left text-xs">
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
          class="group/item flex w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
          @click.stop="updateSelected(uid)">
          <div
            class="flex h-4 w-4 items-center justify-center rounded-full p-[3px]"
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
          <span class="overflow-hidden text-ellipsis">{{
            workspace.name
          }}</span>
        </ScalarDropdownItem>
        <ScalarDropdownDivider />

        <!-- Add new workspace -->
        <ScalarDropdownItem
          class="flex items-center gap-1.5"
          @click="modal.show()">
          <div class="flex h-4 w-4 items-center justify-center">
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
    class="z-overlay absolute"
    :size="'xxs'"
    :state="modal"
    variant="form">
    <form
      class="flex gap-1"
      @submit.prevent="handleCreateWorkspace">
      <input
        v-model="workspaceName"
        class="min-h-8 w-full flex-1 border-none p-1.5 text-sm outline-none"
        placeholder="New Workspace"
        type="text" />
      <ScalarButton
        class="max-h-8 p-0 px-3 text-xs"
        :disabled="!workspaceName.trim()"
        type="submit">
        Continue
      </ScalarButton>
    </form>
  </ScalarModal>
</template>
