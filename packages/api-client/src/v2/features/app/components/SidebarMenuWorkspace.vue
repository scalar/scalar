<script setup lang="ts">
import {
  ScalarMenuLink,
  ScalarMenuSection,
  ScalarMenuWorkspacePicker,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconGear } from '@scalar/icons'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'createWorkspace'): void
}>()

/** We will fill this in with our workspaces when we get them */
const workspaceOptions = computed<ScalarListboxOption[]>(() => [
  {
    id: 'default',
    label: 'Default Workspace',
  },
  {
    id: 'fake',
    label: 'Fake Workspace',
  },
])

const workspaceModel = defineModel<string>({
  required: true,
  default: 'default',
})
</script>
<template>
  <ScalarMenuSection>
    <template #title>Team</template>
    <ScalarMenuWorkspacePicker
      v-model="workspaceModel"
      :workspaceOptions="workspaceOptions"
      @createWorkspace="emit('createWorkspace')" />

    <ScalarMenuLink
      :is="RouterLink"
      :icon="ScalarIconGear"
      to="/settings"
      @click="emit('close')">
      Settings
    </ScalarMenuLink>

    <!-- <ScalarMenuLink
      is="button"
      icon="Leave"
      @click="emit('close')">
      Logout
    </ScalarMenuLink> -->
  </ScalarMenuSection>
</template>
