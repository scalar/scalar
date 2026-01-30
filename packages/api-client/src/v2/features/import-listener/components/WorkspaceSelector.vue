<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  useModal,
  type ScalarListboxOption,
} from '@scalar/components'

import { CreateWorkspaceModal } from '@/v2/features/app'

const { activeWorkspace, workspaces } = defineProps<{
  /**
   * The currently active workspace.
   * This represents the workspace that the user is currently working in.
   */
  activeWorkspace: { id: string; label: string } | null
  /**
   * The list of all available workspaces.
   * Used to render options for workspace switching and selection.
   */
  workspaces: ScalarListboxOption[]
}>()

const emit = defineEmits<{
  /** Emitted when the user selects a workspace */
  (e: 'select:workspace', id?: string): void
  /** Emitted when the user wants to create a new workspace */
  (e: 'create:workspace', payload: { name: string }): void
}>()

const createWorkspaceModalState = useModal()
</script>
<template>
  <div class="flex w-[inherit] items-center text-base">
    <ScalarDropdown>
      <ScalarButton
        class="hover:bg-b-2 text-c-3 line-clamp-1 h-full w-fit justify-start px-1.5 py-1 font-normal"
        variant="ghost">
        <div class="m-0 flex items-center gap-1 text-sm font-medium">
          <h2 class="line-clamp-1 w-[calc(100%-10px)] text-left text-xs">
            {{ activeWorkspace?.label }}
          </h2>
          <ScalarIcon
            icon="ChevronDown"
            size="md" />
        </div>
      </ScalarButton>

      <!-- Workspace list -->
      <template #items>
        <ScalarDropdownItem
          v-for="workspace in workspaces"
          :key="workspace.id"
          class="group/item flex w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
          @click.stop="emit('select:workspace', workspace.id)">
          <div
            class="flex h-4 w-4 items-center justify-center rounded-full p-[3px]"
            :class="
              activeWorkspace?.id === workspace.id
                ? 'bg-c-accent text-b-1'
                : 'shadow-border text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3" />
          </div>
          <span class="overflow-hidden text-ellipsis">{{
            workspace.label
          }}</span>
        </ScalarDropdownItem>
        <ScalarDropdownDivider />

        <!-- Add new workspace button -->
        <ScalarDropdownItem
          class="flex items-center gap-1.5"
          @click="createWorkspaceModalState.show()">
          <div class="flex h-4 w-4 items-center justify-center">
            <ScalarIcon
              icon="Add"
              size="sm" />
          </div>
          <span>New Workspace</span>
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>

    <!-- Create workspace modal -->
    <CreateWorkspaceModal
      :state="createWorkspaceModalState"
      @create:workspace="(payload) => emit('create:workspace', payload)" />
  </div>
</template>
