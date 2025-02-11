<script setup lang="ts">
import { PathId } from '@/routes'
import { useActiveEntities } from '@/store'
import {
  type Icon,
  ScalarSidebar,
  ScalarSidebarItem,
  ScalarSidebarItems,
} from '@scalar/components'
import { computed } from 'vue'
import { type RouteLocationNamedRaw, RouterLink, useRouter } from 'vue-router'

const { currentRoute } = useRouter()
const { activeCollection } = useActiveEntities()

type CollectionSidebarEntry = {
  icon: Icon
  to: RouteLocationNamedRaw
  displayName: string
}

const routes = computed<CollectionSidebarEntry[]>(() => [
  {
    displayName: 'Info',
    icon: 'Settings',
    to: {
      name: 'collection.overview',
      params: {
        [PathId.Collection]: activeCollection.value?.uid,
      },
    },
  },
  {
    displayName: 'Servers',
    icon: 'Server',
    to: {
      name: 'collection.servers',
      params: {
        [PathId.Collection]: activeCollection.value?.uid,
      },
    },
  },
])
</script>
<template>
  <div class="flex-1">
    <ScalarSidebar>
      <ScalarSidebarItems>
        <ScalarSidebarItem
          :is="RouterLink"
          v-for="({ icon, to, displayName }, i) in routes"
          :key="i"
          class="text-sm"
          :icon="icon"
          :selected="
            typeof to.name === 'string' &&
            typeof currentRoute.name === 'string' &&
            currentRoute.name?.startsWith(to.name)
          "
          :to="to">
          {{ displayName }}
        </ScalarSidebarItem>
      </ScalarSidebarItems>
    </ScalarSidebar>
  </div>
</template>
