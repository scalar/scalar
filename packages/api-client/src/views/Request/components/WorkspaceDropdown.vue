<script setup lang="ts">
import CommandPalette from '@/components/CommandPalette/CommandPalette.vue'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  useModal,
} from '@scalar/components'
import { useRouter } from 'vue-router'

const commandPaletteState = useModal()

const { activeWorkspace, workspaces } = useWorkspace()
const { push } = useRouter()

const updateSelected = (uid: string) => {
  if (uid === activeWorkspace.value.uid) return
  push(`/workspace/${uid}`)
}

const createNewWorkspace = () => {
  commandPaletteState.show()
}
</script>

<template>
  <CommandPalette
    defaultCommand="Create Workspace"
    :state="commandPaletteState" />
  <div class="xl:min-h-header py-2.5 flex items-center border-b px-2.5 text-sm">
    <ScalarDropdown>
      <ScalarButton
        class="font-normal h-full justify-start py-1.5 px-1.5 text-c-1 hover:bg-b-2 w-fit"
        fullWidth
        variant="ghost">
        <h2 class="font-medium m-0 text-sm flex gap-1.5 items-center">
          {{ activeWorkspace.name }}
          <ScalarIcon
            class="size-2.5"
            icon="ChevronDown"
            thickness="3.5" />
        </h2>
      </ScalarButton>

      <!-- Workspace list -->
      <template #items>
        <ScalarDropdownItem
          v-for="(workspace, uid) in workspaces"
          :key="uid"
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
          @click.stop="updateSelected(uid)">
          <div
            class="flex items-center justify-center rounded-full p-[3px] w-4 h-4 group-hover/item:shadow-border"
            :class="
              activeWorkspace.uid === uid
                ? 'bg-blue text-b-1'
                : 'text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3.5" />
          </div>
          {{ workspace.name }}
        </ScalarDropdownItem>
        <ScalarDropdownDivider />

        <!-- Add new workspace -->
        <ScalarDropdownItem
          class="flex items-center gap-1.5"
          @click="createNewWorkspace">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="Add" />
          </div>
          <span>Create new workspace</span>
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>
  </div>
</template>
