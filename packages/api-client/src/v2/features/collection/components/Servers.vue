<script setup lang="ts">
import {
  ScalarButton,
  ScalarMarkdown,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { debounce } from '@scalar/helpers/general/debounce'
import { ScalarIconPlus, ScalarIconTrash } from '@scalar/icons'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import { ServerVariablesForm } from '@/components/Server'
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'

import Form from './Form.vue'

const { document, eventBus } = defineProps<CollectionProps>()

const deleteModal = useModal()
const selectedServerIndex = ref<number>(-1)

/** Grab whichever server we are working on */
const selectedServer = computed(
  () => document?.servers?.[selectedServerIndex.value],
)

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
const openDeleteModal = (index: number) => {
  selectedServerIndex.value = index
  deleteModal.show()
}

/** Closes the delete modal and resets the selected server */
const resetState = () => {
  deleteModal.hide()
  selectedServerIndex.value = -1
}

/** Handles server deletion */
const handleDeleteServer = () => {
  if (selectedServerIndex.value < 0) {
    return
  }

  eventBus.emit('server:delete:server', { index: selectedServerIndex.value })
  resetState()
}

/** Debounced execute function for server updates, keyed so we only debounce by server + key */
const { execute } = debounce({ delay: 328, maxWait: 1000 })

/** Handles server property updates with debouncing */
const handleServerUpdate = (
  index: number,
  key: string,
  value: string | number,
) =>
  execute(`${index}-${key}`, () =>
    eventBus.emit('server:update:server', {
      index,
      server: { [key]: value },
    }),
  )

/** Handles server variable updates with debouncing */
const handleVariableUpdate = (index: number, key: string, value: string) =>
  execute(`${index}-${key}`, () =>
    eventBus.emit('server:update:variables', {
      index,
      key,
      value,
    }),
  )

/** Handles adding a new server */
const handleAddServer = () => eventBus.emit('server:add:server')

/**
 * Gets the display name for a server
 */
const getServerDisplayName = (server?: ServerObject, index = 0): string =>
  server?.description || `Server ${index + 1}`
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
        :key="index"
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
            data-testid="delete-server-button"
            variant="ghost"
            @click="openDeleteModal(index)">
            <ScalarIconTrash class="size-3.5" />
          </ScalarButton>
        </div>

        <!-- Server Variables Form -->
        <div
          class="divide-0 flex w-full flex-col divide-y rounded-b-lg text-sm">
          <Form
            :data="server"
            :environment="environment"
            :onUpdate="(key, value) => handleServerUpdate(index, key, value)"
            :options="FORM_OPTIONS" />
          <ServerVariablesForm
            v-if="server.variables"
            :variables="server.variables"
            @update:variable="
              (name, value) => handleVariableUpdate(index, name, value)
            " />
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
    size="xxs"
    :state="deleteModal"
    :title="`Delete ${getServerDisplayName(selectedServer, selectedServerIndex)}`">
    <DeleteSidebarListElement
      variableName="Server"
      warningMessage="Are you sure you want to delete this server? This action cannot be undone."
      @close="resetState"
      @delete="handleDeleteServer" />
  </ScalarModal>
</template>
