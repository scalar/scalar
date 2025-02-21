<script setup lang="ts">
import { LibraryIcon } from '@scalar/icons'
import { computed } from 'vue'
import { RouterLink, useRouter, type RouteLocationNamedRaw } from 'vue-router'

import { PathId } from '@/routes'
import { useActiveEntities } from '@/store'

import CollectionInfoForm from './CollectionInfoForm.vue'

defineProps<{
  isSticky: boolean
}>()

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
  <div class="bg-b-1 sticky -top-[104px] z-10 mx-auto w-full">
    <CollectionInfoForm />
    <div
      class="flex h-fit items-center text-sm font-medium"
      :class="isSticky ? 'border-b md:pl-4' : 'md:mx-auto md:max-w-[50dvw]'">
      <template v-if="isSticky">
        <LibraryIcon
          class="text-c-2 hidden size-3.5 md:block"
          :src="
            activeCollection?.['x-scalar-icon'] || 'interface-content-folder'
          "
          stroke-width="2" />
        <span
          class="text-c-1 mr-[7.25px] hidden w-56 max-w-56 overflow-hidden text-ellipsis whitespace-nowrap px-2 font-medium md:block"
          >{{ activeCollection?.info?.title }}</span
        >
      </template>
      <div
        class="ml-1.75 flex w-full gap-1"
        :class="!isSticky && 'border-b'">
        <RouterLink
          v-for="({ to, displayName }, i) in routes"
          :key="i"
          class="-ml-2 flex h-10 cursor-pointer items-center whitespace-nowrap px-2 text-center text-sm font-medium no-underline -outline-offset-1 has-[:focus-visible]:outline"
          :to="to">
          <span
            class="flex-center h-full w-full border-b"
            :class="
              typeof to.name === 'string' &&
              typeof currentRoute.name === 'string' &&
              currentRoute.name?.startsWith(to.name)
                ? 'text-c-1 border-c-1'
                : 'text-c-2 hover:text-c-1 border-transparent'
            ">
            {{ displayName }}
          </span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
