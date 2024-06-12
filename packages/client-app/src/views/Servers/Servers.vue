<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { themeClasses } from '@/constants'
import { useWorkspace } from '@/store/workspace'
import { createServer } from '@scalar/oas-utils/entities/workspace/server'
import { useRouter } from 'vue-router'

import ServerForm from './ServerForm.vue'

const { activeCollection, servers, serverMutators } = useWorkspace()
const { push } = useRouter()

const addServerHandler = () => {
  if (!activeCollection.value) return

  const newServer = createServer({ url: 'http://localhost' })
  serverMutators.add(newServer, activeCollection.value.uid)

  push(`/servers/${newServer.uid}`)
}
</script>
<template>
  <ViewLayout>
    <Sidebar>
      <template #title>Servers</template>
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <SidebarListElement
              v-for="serverUid in activeCollection?.spec.serverUids"
              :key="serverUid"
              class="text-xs"
              :variable="{ name: servers[serverUid].url, uid: serverUid }" />
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton :click="addServerHandler">
          <template #title>Add Server</template>
        </SidebarButton>
      </template>
    </Sidebar>

    <!-- TODO possible loading state -->
    <ViewLayoutContent :class="[themeClasses.view]">
      <ServerForm />
    </ViewLayoutContent>
  </ViewLayout>
</template>
