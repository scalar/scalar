<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import { themeClasses } from '@/constants'
import { useWorkspace } from '@/store/workspace'
import { serverSchema } from '@scalar/oas-utils/entities/workspace/server'

import ServerForm from './ServerForm.vue'

const { activeCollection, collectionMutators } = useWorkspace()

const addServerHandler = () => {
  if (!activeCollection.value) return

  collectionMutators.edit(activeCollection.value.uid, 'spec.servers', [
    ...activeCollection.value.spec.servers,
    serverSchema.parse({ url: 'http://localhost' }),
  ])
}
</script>
<template>
  <Sidebar>
    <template #title>Servers</template>
    <template #content>
      <div class="flex-1">
        <SidebarList>
          <SidebarListElement
            v-for="server in activeCollection?.spec.servers"
            :key="server.uid"
            class="text-xs"
            :variable="{ name: server.url, uid: server.uid }" />
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
  <ViewLayout :class="[themeClasses.view]">
    <ServerForm />
  </ViewLayout>
</template>
