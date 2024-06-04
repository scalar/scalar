<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { themeClasses } from '@/constants'
import { useWorkspace } from '@/store/workspace'
import { nanoid } from 'nanoid'

import ServerForm from './ServerForm.vue'

const { servers, serverMutators } = useWorkspace()

function addServerHandler() {
  const server = {
    uid: nanoid(),
    name: 'new server',
    url: 'http://localhost',
  }

  serverMutators.add(server)
}
</script>
<template>
  <Sidebar>
    <template #title>Servers</template>
    <template #content>
      <div class="flex-1">
        <SidebarList>
          <SidebarListElement
            v-for="server in servers"
            :key="server.uid"
            class="text-xs"
            :variable="{ name: server.name, uid: server.uid }" />
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
