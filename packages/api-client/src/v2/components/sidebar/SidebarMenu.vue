<script setup lang="ts">
import {
  ScalarMenu,
  ScalarMenuLink,
  ScalarMenuResources,
  ScalarMenuSection,
  ScalarMenuSupport,
  ScalarMenuWorkspacePicker,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconGear } from '@scalar/icons'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { Workspace } from '@/v2/hooks/use-workspace-selector'

const { activeWorkspace, workspaces } = defineProps<{
  /**
   * The currently active workspace.
   * This represents the workspace that the user is currently working in.
   */
  activeWorkspace: Workspace
  /**
   * The list of all available workspaces.
   * Used to render options for workspace switching and selection.
   */
  workspaces: Workspace[]
}>()

const emit = defineEmits<{
  /** Emitted when the user wants to create a new workspace */
  (e: 'create:workspace'): void
  /** Emitted when the user selects a workspace */
  (e: 'select:workspace', id?: string): void
}>()

const workspaceOptions = computed<ScalarListboxOption[]>(() =>
  workspaces.map((ws) => ({
    label: ws.name,
    id: ws.id,
  })),
)
</script>
<template>
  <!-- Desktop app menu -->
  <ScalarMenu>
    <template #products>
      <!-- <AppHeaderProducts /> -->
    </template>
    <template #sections="{ close }">
      <ScalarMenuSection>
        <template #title>Team</template>
        <ScalarMenuWorkspacePicker
          :modelValue="activeWorkspace.id"
          :workspaceOptions="workspaceOptions"
          @createWorkspace="emit('create:workspace')"
          @update:modelValue="(value) => emit('select:workspace', value)" />

        <ScalarMenuLink
          :is="RouterLink"
          :icon="ScalarIconGear"
          to="/settings"
          @click="close">
          Settings
        </ScalarMenuLink>

        <!-- <ScalarMenuLink
      is="button"
      icon="Leave"
      @click="emit('close')">
      Logout
    </ScalarMenuLink> -->
      </ScalarMenuSection>

      <!-- <AppHeaderTeam
                v-if="isLoggedIn"
                @close="close" />
              <AppHeaderLoggedOut v-else /> -->
      <ScalarMenuResources />
      <ScalarMenuSupport />
    </template>
  </ScalarMenu>
</template>
