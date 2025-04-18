<script setup lang="ts">
import { LibraryIcon } from '@scalar/icons/library'
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
    displayName: 'Authentication',
    // icon: 'Lock',
    to: {
      name: 'collection.authentication',
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
      class="items-center text-sm font-medium"
      :class="
        isSticky
          ? 'h-fit border-b md:grid md:grid-cols-[1fr_720px_1fr] md:px-4'
          : 'flex md:mx-auto md:max-w-[720px]'
      ">
      <div
        v-if="isSticky"
        class="flex max-w-40 items-center">
        <LibraryIcon
          class="text-c-2 hidden size-3.5 md:block"
          :src="
            activeCollection?.['x-scalar-icon'] || 'interface-content-folder'
          "
          stroke-width="2" />
        <span
          class="text-c-1 mr-[6.25px] hidden overflow-hidden text-ellipsis whitespace-nowrap px-2 font-medium md:block"
          >{{ activeCollection?.info?.title }}</span
        >
      </div>
      <div
        class="flex w-full max-w-[720px] gap-2 pl-1.5 md:ml-1.5 md:pl-0"
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
