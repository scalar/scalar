<!--
  A dropdown component for selecting and managing workspaces. Displays available
  workspaces organized by groups (teams and local), allows switching between them,
  and provides functionality to create new workspaces with namespace support.
-->
<script setup lang="ts">
import { CreateWorkspaceModal } from '@scalar/api-client/app'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  useModal,
  type ScalarListboxOption,
  type WorkspaceGroup,
} from '@scalar/components'

import { type CreateWorkspacePayload } from '@/features/import-listener/types'

const { workspaceGroups: worksapceGroups, activeWorkspace } = defineProps<{
  /** List of workspace groups */
  workspaceGroups: WorkspaceGroup[]
  /** The active workspace */
  activeWorkspace: ScalarListboxOption | null
}>()

const emit = defineEmits<{
  /** Emitted when the user wants to set the active workspace */
  (e: 'set:workspace', id: string): void
  /** Emitted when the user wants to create a new workspace */
  (e: 'create:workspace', payload: CreateWorkspacePayload): void
}>()

const createWorkspaceModal = useModal()
</script>
<template>
  <div class="flex w-[inherit] items-center text-base">
    <ScalarDropdown>
      <ScalarButton
        class="text-c-3 hover:bg-b-2 line-clamp-1 h-full w-fit justify-start px-1.5 py-1 font-normal"
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
        <template
          v-for="group in worksapceGroups"
          :key="group.label">
          <!-- If the group has children, render as a group -->
          <template v-if="group.options && group.options.length > 0">
            <!-- Group label -->
            <div class="text-c-3 px-3 py-1.5 text-xs font-medium">
              {{ group.label }}
            </div>
            <!-- Group children -->
            <ScalarDropdownItem
              v-for="workspace in group.options"
              :key="workspace.id"
              class="group/item flex w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
              @click.stop="emit('set:workspace', workspace.id)">
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
          </template>
          <!-- If no children, render as a flat workspace -->
          <ScalarDropdownItem
            v-for="workspace in group.options"
            v-else
            :key="workspace.id"
            class="group/item flex w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
            @click.stop="emit('set:workspace', workspace.id)">
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
            <span class="overflow-hidden text-ellipsis">{{ group.label }}</span>
          </ScalarDropdownItem>
        </template>
        <ScalarDropdownDivider />

        <!-- Add new workspace button -->
        <ScalarDropdownItem
          class="flex items-center gap-1.5"
          @click="createWorkspaceModal.show()">
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
      :state="createWorkspaceModal"
      @create:workspace="(payload) => emit('create:workspace', payload)" />
  </div>
</template>
