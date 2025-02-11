<script setup lang="ts">
import { Sidebar } from '@/components'
import EmptyState from '@/components/EmptyState.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { PathId } from '@/routes'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CollectionServerForm from './CollectionServerForm.vue'

const { activeCollection } = useActiveEntities()
const { servers, events, serverMutators } = useWorkspace()
const { push, resolve } = useRouter()
const route = useRoute()

const collectionUidParam = computed(
  () => route.params[PathId.Collection] as string,
)
const selectedServerUid = computed(() => route.params[PathId.Servers] as string)

function openAddServerCommand() {
  events.commandPalette.emit({
    commandName: 'Add Server',
    metaData: {
      parentUid: activeCollection.value?.uid,
    },
  })
}

const handleNavigation = (event: MouseEvent, uid: string) => {
  const to = {
    name: 'collection.servers.edit',
    params: {
      [PathId.Servers]: uid,
    },
  }

  if (event.metaKey) {
    window.open(resolve(to).href, '_blank')
  } else {
    push(to)
  }
}

function handleDelete(uid: string) {
  console.log('handleDelete', uid)
  if (!activeCollection?.value?.uid) {
    return
  }

  serverMutators.delete(uid, activeCollection.value.uid)
}

const collectionServers = computed(() =>
  Object.values(servers || {}).filter((server) =>
    activeCollection.value?.servers.includes(server.uid),
  ),
)
</script>
<template>
  <ViewLayout>
    <Sidebar>
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <SidebarListElement
              v-for="server in collectionServers"
              :key="server.uid"
              :collectionId="activeCollection?.uid"
              :isDeletable="true"
              :to="{
                name: 'collection.servers.edit',
                params: {
                  [PathId.Servers]: server.uid,
                },
              }"
              type="servers"
              :variable="{
                name: server.url ?? '',
                uid: server.uid,
              }"
              @click="
                ($event: MouseEvent) => handleNavigation($event, server.uid)
              "
              @delete="() => handleDelete(server.uid)" />
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton :click="openAddServerCommand">
          <template #title>Add Server</template>
        </SidebarButton>
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <CollectionServerForm
        v-if="selectedServerUid"
        :collectionId="collectionUidParam"
        :serverUid="selectedServerUid" />
      <EmptyState v-else />
    </ViewLayoutContent>
  </ViewLayout>
</template>
