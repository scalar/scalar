<script setup lang="ts">
import {
  ScalarMenuLink,
  ScalarMenuWorkspacePicker,
  type WorkspaceGroup,
} from '@scalar/components'
import {
  ScalarIconGear,
  ScalarIconSignIn,
  ScalarIconSignOut,
} from '@scalar/icons'
import { computed } from 'vue'

import type { AppState } from '@/features/app'
import { useAuth } from '@/hooks/use-auth'

const { app } = defineProps<{
  /**
   * App state used to surface the workspace picker inside the menu. The
   * top-level breadcrumb already exposes the picker on tablet and up, but
   * on mobile we hide the breadcrumb entirely - so the menu becomes the
   * canonical place to switch workspaces on small screens.
   */
  app: AppState
}>()

const emit = defineEmits<{
  (e: 'openSettings'): void
  (e: 'login'): void
  (e: 'createWorkspace'): void
}>()

const { isLoggedIn, logout } = useAuth()

/**
 * Workspaces grouped by team, mapped into the shape the menu picker
 * expects. Mirrors the breadcrumb's workspace combobox so both surfaces
 * stay in sync.
 */
const workspaceGroups = computed<WorkspaceGroup[]>(() =>
  app.workspace.workspaceGroups.value.map((group) => ({
    label: group.label ?? '',
    options: group.options.map((option) => ({
      id: option.id,
      label: option.label,
    })),
  })),
)

const activeWorkspaceId = computed<string | undefined>(
  () => app.workspace.activeWorkspace.value?.id ?? undefined,
)

const handleSelectWorkspace = (id: string | undefined) => {
  if (!id || id === activeWorkspaceId.value) {
    return
  }
  app.workspace.navigateToWorkspaceGetStarted(id)
}
</script>

<template>
  <!--
    Workspace picker is only surfaced inside the menu on mobile. On tablet
    and up the breadcrumb owns it, so we hide the menu entry to avoid
    duplicating affordances.
  -->
  <ScalarMenuWorkspacePicker
    v-if="workspaceGroups.length > 0"
    class="md:hidden"
    :modelValue="activeWorkspaceId"
    :workspaceOptions="workspaceGroups"
    @createWorkspace="emit('createWorkspace')"
    @update:modelValue="handleSelectWorkspace" />
  <ScalarMenuLink
    is="button"
    :icon="ScalarIconGear"
    @click="emit('openSettings')">
    Settings
  </ScalarMenuLink>
  <ScalarMenuLink
    is="button"
    v-if="!isLoggedIn"
    :icon="ScalarIconSignIn"
    @click="emit('login')">
    Log in
  </ScalarMenuLink>
  <ScalarMenuLink
    is="button"
    v-else
    :icon="ScalarIconSignOut"
    @click="logout">
    Log out
  </ScalarMenuLink>
</template>
