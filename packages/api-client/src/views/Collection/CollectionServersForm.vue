<script setup lang="ts">
import { ScalarButton, ScalarMarkdown } from '@scalar/components'
import { computed } from 'vue'

import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CollectionServerForm from './CollectionServerForm.vue'

const { activeCollection } = useActiveEntities()
const { servers, events } = useWorkspace()

const collectionServers = computed(() =>
  Object.values(servers || {}).filter((server) =>
    activeCollection.value?.servers.includes(server.uid),
  ),
)

/** Add server */
const handleAddServer = () =>
  events.commandPalette.emit({
    commandName: 'Add Server',
  })
</script>

<template>
  <div
    class="mx-auto flex h-full w-full flex-col gap-12 px-1.5 py-8 md:max-h-[82dvh] md:max-w-[50dvw]">
    <div class="flex flex-col gap-4">
      <div class="flex justify-between gap-2">
        <div class="flex flex-col gap-2">
          <h3>Servers</h3>
          <p class="text-sm">
            Add different base URLs for your API. You can use
            <code class="font-code text-c-2">{variables}</code> for dynamic
            parts.
          </p>
        </div>
        <ScalarButton
          class="hover:bg-b-2 ml-auto inline-flex max-h-8 w-fit cursor-pointer items-center justify-center rounded border p-2 text-xs"
          variant="outlined"
          @click="handleAddServer">
          Add Server
        </ScalarButton>
      </div>
      <div
        v-for="(server, index) in collectionServers"
        :key="server.uid">
        <div class="bg-b-2 overflow-hidden rounded-lg border">
          <span class="block px-3 py-1.5 text-sm font-medium">
            <ScalarMarkdown
              v-if="server.description"
              :value="server.description" />
            <span v-else>Server {{ index + 1 }}</span>
          </span>
          <CollectionServerForm
            v-if="activeCollection"
            :collectionId="activeCollection.uid"
            :serverUid="server.uid" />
        </div>
      </div>
    </div>
  </div>
</template>
