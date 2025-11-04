<script setup lang="ts">
import {
  ScalarButton,
  ScalarMarkdown,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { ScalarIconPlus, ScalarIconTrash } from '@scalar/icons'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { computed, ref } from 'vue'

import { ServerVariablesForm } from '@/components/Server'
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'

import Form from './Form.vue'

const { document, eventBus } = defineProps<CollectionProps>()

const deleteModal = useModal()
const selectedServerUrl = ref<string | null>(null)

/** Grab the document servers */
const servers = computed(() => document?.servers ?? [])

// Form field configuration
const FORM_OPTIONS = [
  {
    label: 'URL',
    key: 'url',
    placeholder: 'https://void.scalar.com',
  },
  {
    label: 'Description',
    key: 'description',
    placeholder: 'Production',
  },
]

/** Opens the delete confirmation modal for a server */
const openDeleteModal = (serverUrl: string) => {
  selectedServerUrl.value = serverUrl
  deleteModal.show()
}

/** Closes the delete modal and resets the selected server */
const closeDeleteModal = () => {
  deleteModal.hide()
  selectedServerUrl.value = null
}

/** Handles server deletion */
const handleDeleteServer = () => {
  if (!selectedServerUrl.value) {
    return
  }

  // TODO: Implement proper server deletion event handling
  // The event handler needs to be added to use-workspace-client-events.ts
  ;(eventBus.emit as any)('server:delete', { url: selectedServerUrl.value })
  closeDeleteModal()
}

/**
 * Handles server property updates
 * Note: This updates the selected server - may need to select server first
 */
const handleServerUpdate = (key: string, value: string) => {
  // TODO: Implement proper server update event handling
  // May need to select the server first or update by URL
  ;(eventBus.emit as any)('server:update:selected-properties', {
    key: key as keyof ServerObject,
    value,
  })
}

/**
 * Handles server variable updates
 */
const handleVariableUpdate = (name: string, value: string) => {
  // TODO: Implement proper server variable update event handling
  ;(eventBus.emit as any)('server:update:variables', {
    key: name,
    value,
  })
}

/**
 * Handles adding a new server
 */
const handleAddServer = () => {
  // TODO: Implement server addition via command palette or direct event
  ;(eventBus.emit as any)('server:add', {
    server: {
      url: 'https://api.example.com',
    },
  })
}

/**
 * Gets the display name for a server
 */
const getServerDisplayName = (server: ServerObject, index: number): string =>
  server.description || `Server ${index + 1}`
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header Section -->
    <div class="flex flex-col gap-2">
      <h3 class="font-bold">Servers</h3>
      <p class="text-sm">
        Add different base URLs for your API. You can use
        <code class="font-code text-c-2">{variables}</code> for dynamic parts.
      </p>
    </div>

    <!-- Server List -->
    <div class="flex flex-col gap-4">
      <div
        v-for="(server, index) in servers"
        :key="server.url"
        class="rounded-lg border">
        <!-- Server Header -->
        <div
          class="bg-b-2 flex items-center justify-between rounded-t-lg px-3 py-1 text-sm">
          <ScalarMarkdown
            v-if="server.description"
            class="self-center"
            :value="server.description" />
          <span
            v-else
            class="self-center">
            {{ getServerDisplayName(server, index) }}
          </span>
          <ScalarButton
            class="hover:bg-b-3 hover:text-c-1 h-fit p-1.25"
            variant="ghost"
            @click="openDeleteModal(server.url)">
            <ScalarIconTrash class="size-3.5" />
          </ScalarButton>
        </div>

        <!-- Server Form -->
        <div
          class="divide-0 flex w-full flex-col divide-y rounded-b-lg text-sm">
          <Form
            :data="server"
            :environment="environment"
            :onUpdate="handleServerUpdate"
            :options="FORM_OPTIONS" />
          <ServerVariablesForm
            v-if="server.variables"
            :variables="server.variables"
            @update:variable="handleVariableUpdate" />
        </div>
      </div>
    </div>

    <!-- Add Server Button -->
    <div
      class="text-c-3 flex h-full items-center justify-center rounded-lg border p-4">
      <ScalarButton
        class="hover:bg-b-2 hover:text-c-1 flex items-center gap-2"
        size="sm"
        variant="ghost"
        @click="handleAddServer">
        <ScalarIconPlus />
        <span>Add Server</span>
      </ScalarButton>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <ScalarModal
    v-if="selectedServerUrl"
    size="xxs"
    :state="deleteModal"
    :title="`Delete ${selectedServerUrl}`">
    <DeleteSidebarListElement
      variableName="Server"
      warningMessage="Are you sure you want to delete this server? This action cannot be undone."
      @close="closeDeleteModal"
      @delete="handleDeleteServer" />
  </ScalarModal>
</template>
