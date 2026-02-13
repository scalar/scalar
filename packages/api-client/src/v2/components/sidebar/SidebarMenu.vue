<script setup lang="ts">
import {
  ScalarMenu,
  ScalarMenuLink,
  ScalarMenuResources,
  ScalarMenuSection,
  ScalarMenuSupport,
  ScalarMenuWorkspacePicker,
  type WorkspaceGroup,
} from '@scalar/components'
import { ScalarIconGear } from '@scalar/icons'

const { activeWorkspace, workspaces } = defineProps<{
  /**
   * The currently active workspace.
   * This represents the workspace that the user is currently working in.
   */
  activeWorkspace: { id: string }
  /**
   * The list of all available workspaces.
   * Used to render options for workspace switching and selection.
   */
  workspaces: WorkspaceGroup[]
}>()

const emit = defineEmits<{
  /** Emitted when the user wants to create a new workspace */
  (e: 'create:workspace'): void
  /** Emitted when the user selects a workspace */
  (e: 'select:workspace', id?: string): void
  /** Emitted when the user wants to open the settings */
  (e: 'navigate:to:settings'): void
}>()

defineSlots<{
  /** Slot for customizing the actions section of the sidebar menu. */
  sidebarMenuActions?(): unknown
}>()
</script>
<template>
  <!-- Desktop app menu -->
  <ScalarMenu>
    <template #products>
      <!-- <AppHeaderProducts /> -->
    </template>
    <template #sections="{ close }">
      <ScalarMenuSection>
        <slot name="sidebarMenuActions">
          <ScalarMenuWorkspacePicker
            :modelValue="activeWorkspace.id"
            :workspaceOptions="workspaces"
            @createWorkspace="emit('create:workspace')"
            @update:modelValue="(value) => emit('select:workspace', value)" />
          <ScalarMenuLink
            is="button"
            :icon="ScalarIconGear"
            @click="
              () => {
                close()
                emit('navigate:to:settings')
              }
            ">
            Settings
          </ScalarMenuLink>
        </slot>
      </ScalarMenuSection>
      <ScalarMenuResources />
      <ScalarMenuSupport />
    </template>
  </ScalarMenu>
</template>
