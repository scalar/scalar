<script setup lang="ts">
import {
  ScalarButton,
  ScalarMarkdown,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { ScalarIconPlus, ScalarIconTrash } from '@scalar/icons'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { ref } from 'vue'

import Form from '@/components/Form/Form.vue'
import { ServerVariablesForm } from '@/components/Server'
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import type { createStoreEvents } from '@/store/events'

const {
  events,
  servers = [
    {
      url: 'https://api.example.com/v1',
      description: 'Production server',
      variables: {},
    },
    {
      url: '{scheme}://{base}/v1',
      description: 'Staging server',
      variables: {
        scheme: {
          default: 'https',
          enum: ['http', 'https'],
        },
        base: {
          default: 'staging-api.example.com',
        },
      },
    },
  ],
} = defineProps<{
  /** List of server objects */
  servers: ServerObject[]
  /** Event bus */
  events: ReturnType<typeof createStoreEvents>
}>()

const emit = defineEmits<{
  (e: 'server:delete', payload: { serverUrl: string }): void
  (
    e: 'server:update:variable',
    payload: { serverUrl: string; name: string; value: string },
  ): void
}>()

const deleteModal = useModal()

/** Currently selected server for deletion */
const selectedServer = ref<string | null>(null)

const openDeleteModal = (serverUrl: string) => {
  selectedServer.value = serverUrl
  deleteModal.show()
}

const handleAddServer = () => {
  events.commandPalette.emit({ commandName: 'Add Server' })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Tab Header -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-col gap-2">
        <div class="flex h-8 items-center">
          <h3 class="font-bold">Servers</h3>
        </div>
        <p class="text-sm">
          Add different base URLs for your API. You can use
          <code class="font-code text-c-2">{variables}</code> for dynamic parts.
        </p>
      </div>
    </div>
    <!-- Server List Cards -->
    <div
      v-for="(server, index) in servers"
      :key="server.url">
      <div class="rounded-lg border">
        <div
          class="bg-b-2 flex items-start justify-between rounded-t-lg py-1 pr-1 pl-3 text-sm">
          <ScalarMarkdown
            v-if="server.description"
            class="self-center"
            :value="server.description" />
          <span
            v-else
            class="self-center">
            Server {{ index + 1 }}
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
          class="divide-0. flex w-full flex-col divide-y rounded-b-lg text-sm">
          <Form
            :data="server"
            :onUpdate="
              (name, value) =>
                emit('server:update:variable', {
                  serverUrl: server.url,
                  name,
                  value,
                })
            "
            :options="[
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
            ]" />
          <ServerVariablesForm
            v-if="server.variables"
            :variables="server.variables"
            @update:variable="
              (name, value) =>
                emit('server:update:variable', {
                  serverUrl: server.url,
                  name,
                  value,
                })
            " />
        </div>
      </div>
    </div>
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
  <ScalarModal
    v-if="selectedServer"
    :size="'xxs'"
    :state="deleteModal"
    :title="`Delete ${selectedServer ?? 'Server'}`">
    <DeleteSidebarListElement
      :variableName="'Server'"
      :warningMessage="'Are you sure you want to delete this server? This action cannot be undone.'"
      @close="deleteModal.hide()"
      @delete="emit('server:delete', { serverUrl: selectedServer })" />
  </ScalarModal>
</template>
