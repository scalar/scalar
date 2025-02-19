<script setup lang="ts">
// import type { Icon } from '@scalar/components'
import { computed } from 'vue'
import { RouterLink, useRouter, type RouteLocationNamedRaw } from 'vue-router'

import { PathId } from '@/routes'
import { useActiveEntities } from '@/store'

import CollectionInfoForm from './CollectionInfoForm.vue'

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
  <div class="mx-auto w-full md:max-w-[50dvw]">
    <CollectionInfoForm />
    <div
      class="gap-1/2 bg-b-1 sticky top-0 flex h-fit items-center text-sm font-medium">
      <RouterLink
        v-for="({ to, displayName }, i) in routes"
        :key="i"
        class="-ml-0.5 flex h-11 cursor-pointer items-center whitespace-nowrap px-2 text-center text-sm font-medium no-underline -outline-offset-1 has-[:focus-visible]:outline"
        :to="to">
        <span
          class="flex-center h-full w-full border-b border-transparent"
          :class="
            typeof to.name === 'string' &&
            typeof currentRoute.name === 'string' &&
            currentRoute.name?.startsWith(to.name)
              ? 'text-c-1 border-white'
              : 'text-c-2 hover:text-c-1'
          ">
          {{ displayName }}
        </span>
      </RouterLink>
    </div>
  </div>
</template>
