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

import { useAuth } from '@/hooks/use-auth'

defineProps<{
  activeWorkspaceId?: string
  workspaceGroups: WorkspaceGroup[]
}>()

const emit = defineEmits<{
  (e: 'createWorkspace'): void
  (e: 'setWorkspace', id: string | undefined): void
  (e: 'openSettings'): void
  (e: 'login'): void
}>()

const { isLoggedIn, logout } = useAuth()
</script>

<template>
  <ScalarMenuWorkspacePicker
    :modelValue="activeWorkspaceId"
    :workspaceOptions="workspaceGroups"
    @createWorkspace="emit('createWorkspace')"
    @update:modelValue="(id) => emit('setWorkspace', id)" />
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
