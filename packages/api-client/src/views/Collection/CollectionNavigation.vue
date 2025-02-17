<script setup lang="ts">
// import type { Icon } from '@scalar/components'
import { computed } from 'vue'
import { RouterLink, useRouter, type RouteLocationNamedRaw } from 'vue-router'

import { PathId } from '@/routes'
import { useActiveEntities } from '@/store'

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
  // {
  //   displayName: 'Authentication',
  //   // icon: 'Lock',
  //   to: {
  //     name: 'collection.authentication',
  //     params: {
  //       [PathId.Collection]: activeCollection.value?.uid,
  //     },
  //   },
  // },
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
  // {
  //   displayName: 'Environments',
  //   // icon: 'Brackets',
  //   to: {
  //     name: 'collection.environment',
  //     params: {
  //       [PathId.Collection]: activeCollection.value?.uid,
  //     },
  //   },
  // },
  // {
  //   displayName: 'Cookies',
  //   // icon: 'Cookie',
  //   to: {
  //     name: 'collection.cookies',
  //     params: {
  //       [PathId.Collection]: activeCollection.value?.uid,
  //     },
  //   },
  // },
  // {
  //   displayName: 'Scripts',
  //   // icon: 'CodeFolder',
  //   to: {
  //     name: 'collection.scripts',
  //     params: {
  //       [PathId.Collection]: activeCollection.value?.uid,
  //     },
  //   },
  // },
  // {
  //   displayName: 'Sync',
  //   // icon: 'Download',
  //   to: {
  //     name: 'collection.sync',
  //   },
  // },
  {
    displayName: 'Settings',
    // icon: 'Settings',
    to: {
      name: 'collection.settings',
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
    class="bg-b-1 sticky top-0 flex min-h-11 items-center gap-5 border-b px-3 text-sm font-medium">
    <RouterLink
      v-for="({ to, displayName }, i) in routes"
      :key="i"
      class="flex h-full cursor-pointer items-center whitespace-nowrap border-b border-solid border-transparent text-center text-sm font-medium no-underline has-[:focus-visible]:outline"
      :class="
        typeof to.name === 'string' &&
        typeof currentRoute.name === 'string' &&
        currentRoute.name?.startsWith(to.name)
          ? 'text-c-1 border-white'
          : 'text-c-2 hover:text-c-1'
      "
      :to="to">
      {{ displayName }}
    </RouterLink>
  </div>
</template>
