<script setup lang="ts">
import {
  ScalarButton,
  ScalarMarkdown,
  ScalarModal,
  ScalarToggle,
  useModal,
} from '@scalar/components'
import { debounce } from '@scalar/helpers/general/debounce'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { ScalarIconPlus, ScalarIconTrash } from '@scalar/icons'
import type { ServerMeta } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import { ServerVariablesForm } from '@/components/Server'
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import Section from '@/v2/features/settings/components/Section.vue'

import Form from './Form.vue'

const { document, eventBus, collectionType, path, method } =
  defineProps<CollectionProps>()

const deleteModal = useModal()
const selectedServerIndex = ref<number>(-1)

const operation = computed(() => {
  if (collectionType === 'operation') {
    // Operation not found
    if (!path || !isHttpMethod(method)) {
      return null
    }
    // Operation found, return the servers
    return getResolvedRef(document?.paths?.[path]?.[method])
  }
  return null
})

const isOperation = computed(() => collectionType === 'operation')

const useOperationServers = ref(operation.value?.servers !== undefined)

/** Grab the servers for the collection */
const servers = computed(() => {
  if (collectionType === 'operation' && operation.value) {
    return operation.value.servers ?? []
  }
  return document?.servers ?? []
})

/** Grab whichever server we are working on */
const selectedServer = computed(() => servers.value[selectedServerIndex.value])

/** Meta for server events: document-level or operation-level based on collection type */
const serverMeta = computed<ServerMeta>(() => {
  if (collectionType === 'operation' && path && isHttpMethod(method)) {
    return { type: 'operation', path, method }
  }
  return { type: 'document' }
})

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

  eventBus.emit('server:delete:server', {
    index: selectedServerIndex.value,
    meta: serverMeta.value,
  })
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
      meta: serverMeta.value,
    }),
  )

/** Handles server variable updates with debouncing */
const handleVariableUpdate = (index: number, key: string, value: string) =>
  execute(`${index}-${key}`, () =>
    eventBus.emit('server:update:variables', {
      index,
      key,
      value,
      meta: serverMeta.value,
    }),
  )

/** Handles adding a new server */
const handleAddServer = () =>
  eventBus.emit('server:add:server', { meta: serverMeta.value })

/**
 * Gets the display name for a server
 */
const getServerDisplayName = (server?: ServerObject, index = 0): string =>
  server?.description || `Server ${index + 1}`

/** Handles toggling the operation servers */
const handleToggleOperationServers = (newValue: boolean) => {
  if (newValue === false) {
    // remove the servers from the operation
    eventBus.emit('server:clear:servers', { meta: serverMeta.value })
  }

  // update the operation servers
  useOperationServers.value = newValue
}
</script>

<template>
  <Section>
    <template #title>Servers</template>
    <template #description>
      <template v-if="isOperation">
        <span class="block">
          Override servers for this operation with the toggle.
        </span>
        <span class="mt-1 block">
          <strong>On</strong> — Servers below apply only to this operation.
        </span>
        <span class="mt-1 block">
          <strong>Off</strong> — Removes operation servers; this operation uses
          document or path servers from the OpenAPI spec.
        </span>
        <span class="text-c-3 mt-1 block">
          Use <code class="font-code text-c-2">{variables}</code> for dynamic
          URL parts.
        </span>
      </template>
      <template v-else>
        Add different base URLs for your API. Use
        <code class="font-code text-c-2">{variables}</code> for dynamic parts.
      </template>
    </template>
    <!-- Operation Servers Toggle to use the operation servers instead of the document servers -->
    <template
      v-if="isOperation"
      #actions>
      <div class="flex h-8 items-center">
        <ScalarToggle
          class="w-4"
          :modelValue="useOperationServers"
          @update:modelValue="handleToggleOperationServers" />
      </div>
    </template>

    <div :class="isOperation && !useOperationServers && 'cursor-not-allowed'">
      <div
        class="flex flex-col gap-4"
        :class="
          isOperation &&
          !useOperationServers &&
          'pointer-events-none cursor-not-allowed opacity-50 mix-blend-luminosity'
        ">
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
                :onUpdate="
                  (key, value) => handleServerUpdate(index, key, value)
                "
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
    </div>
  </Section>

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
