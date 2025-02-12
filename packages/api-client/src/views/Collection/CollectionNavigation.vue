<script setup lang="ts">
import { PathId } from '@/routes'
import { useActiveEntities } from '@/store'
// import type { Icon } from '@scalar/components'
import { computed } from 'vue'
import { type RouteLocationNamedRaw, RouterLink, useRouter } from 'vue-router'

const { currentRoute } = useRouter()
const { activeCollection } = useActiveEntities()

type CollectionSidebarEntry = {
  // icon: Icon
  to: RouteLocationNamedRaw
  displayName: string
}

const routes = computed<CollectionSidebarEntry[]>(() => [
  {
    displayName: 'Overview',
    // icon: 'Collection',
    to: {
      name: 'collection.overview',
      params: {
        [PathId.Collection]: activeCollection.value?.uid,
      },
    },
  },
  {
    displayName: 'Authentication',
    // icon: 'Lock',
    to: {
      name: 'collection.authentication',
      params: {
        [PathId.Collection]: activeCollection.value?.uid,
      },
    },
  },
  {
    displayName: 'Servers',
    // icon: 'Server',
    to: {
      name: 'collection.servers',
      params: {
        [PathId.Collection]: activeCollection.value?.uid,
      },
    },
  },
  {
    displayName: 'Environments',
    // icon: 'Brackets',
    to: {
      name: 'collection.environment',
      params: {
        [PathId.Collection]: activeCollection.value?.uid,
      },
    },
  },
  {
    displayName: 'Cookies',
    // icon: 'Cookie',
    to: {
      name: 'collection.cookies',
      params: {
        [PathId.Collection]: activeCollection.value?.uid,
      },
    },
  },
  {
    displayName: 'Scripts',
    // icon: 'CodeFolder',
    to: {
      name: 'collection.scripts',
      params: {
        [PathId.Collection]: activeCollection.value?.uid,
      },
    },
  },
  {
    displayName: 'Sync',
    // icon: 'Download',
    to: {
      name: 'collection.sync',
    },
  },
])
</script>
<template>
  <!-- <div
    class="border-b min-h-11 -mb-0.25 flex items-center px-2.5 text-sm font-medium sticky top-0 bg-b-1 xl:rounded-none">
    <span class="text-c-2">
      {{ activeCollection?.info?.title || 'Untitled Collection' }}
    </span>
  </div> -->
  <div
    class="border-b-1/2 border-b-c-2 min-h-11 -mb-0.25 flex items-center px-2.5 text-sm font-medium sticky top-0 bg-b-1 xl:rounded-none gap-2">
    <RouterLink
      v-for="({ to, displayName }, i) in routes"
      :key="i"
      class="hover:bg-b-2 rounded p-1 px-2 cursor-pointer text-center font-medium whitespace-nowrap has-[:focus-visible]:outline text-sm no-underline"
      :class="
        typeof to.name === 'string' &&
        typeof currentRoute.name === 'string' &&
        currentRoute.name?.startsWith(to.name)
          ? 'bg-b-3'
          : ''
      "
      :to="to">
      {{ displayName }}
    </RouterLink>
  </div>
</template>
