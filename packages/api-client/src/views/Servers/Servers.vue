<script setup lang="ts">
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { Sidebar } from '@/components'
import EmptyState from '@/components/EmptyState.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useSidebar } from '@/hooks'
import { PathId } from '@/routes'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import ServerForm from './ServerForm.vue'

const {
  activeWorkspaceCollections,
  activeWorkspace,
  activeCollection,
  activeRouterParams,
} = useActiveEntities()
const { servers, events, serverMutators } = useWorkspace()
const { push, resolve } = useRouter()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()

const showChildren = (key: string) => {
  return collapsedSidebarFolders[key]
}

function openCommandPaletteServer(collectionId?: string) {
  events.commandPalette.emit({
    commandName: 'Add Server',
    metaData: { parentUid: collectionId },
  })
}

const collections = computed(() =>
  activeWorkspaceCollections.value.filter(
    (collection: Collection) => collection.info?.title !== 'Drafts',
  ),
)

const handleNavigation = (
  event: MouseEvent,
  uid: string,
  collectionId: string,
) => {
  const to = {
    name: 'servers',
    params: {
      [PathId.Workspace]: activeWorkspace.value?.uid,
      [PathId.Collection]: collectionId,
      [PathId.Servers]: uid,
    },
  }

  if (event.metaKey) {
    window.open(resolve(to).href, '_blank')
  } else {
    push(to)
  }
}

const handleDelete = (uid: string) =>
  activeCollection.value &&
  serverMutators.delete(
    uid as Server['uid'],
    activeRouterParams.value.collection,
  )

const hasServers = computed(() => Object.keys(servers).length > 0)
</script>
<template>
  <ViewLayout>
    <Sidebar title="Servers">
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <li
              v-for="collection in collections"
              :key="collection.uid"
              class="gap-1/2 flex flex-col">
              <button
                class="hover:bg-b-2 group flex w-full items-center gap-1.5 break-words rounded p-1.5 text-left text-sm font-medium"
                type="button"
                @click="toggleSidebarFolder(collection.uid)">
                <span
                  class="flex h-5 max-w-[14px] items-center justify-center pr-px">
                  <LibraryIcon
                    class="text-sidebar-c-2 size-3.5 min-w-3.5 stroke-2 group-hover:hidden"
                    :src="
                      collection['x-scalar-icon'] || 'interface-content-folder'
                    " />
                  <div
                    :class="{
                      'rotate-90': collapsedSidebarFolders[collection.uid],
                    }">
                    <ScalarIcon
                      class="text-c-3 hover:text-c-1 hidden text-sm group-hover:block"
                      icon="ChevronRight"
                      size="md" />
                  </div>
                </span>
                <span
                  class="line-clamp-1 w-full break-all text-left font-medium">
                  {{ collection.info?.title ?? '' }}
                </span>
                <ScalarButton
                  class="hover:bg-b-3 hover:text-c-1 hidden aspect-square h-fit px-0.5 py-0 group-hover:block group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
                  size="sm"
                  variant="ghost"
                  @click.stop.prevent="
                    openCommandPaletteServer(collection.uid)
                  ">
                  <ScalarIcon
                    icon="Add"
                    size="md"
                    thickness="2" />
                </ScalarButton>
              </button>
              <div
                v-show="showChildren(collection.uid)"
                :class="{
                  'before:bg-border before:z-1 gap-1/2 relative mb-[.5px] flex flex-col before:pointer-events-none before:absolute before:left-3 before:top-0 before:h-[calc(100%_+_.5px)] before:w-[.5px] last:mb-0 last:before:h-full':
                    Object.keys(collection['servers'] || {}).length > 0,
                }">
                <SidebarListElement
                  v-for="serverUid in collection['servers']"
                  :key="serverUid"
                  class="[&>a]:pl-[1.625rem]"
                  :collectionId="collection.uid"
                  :isDeletable="true"
                  type="servers"
                  :variable="{
                    name: servers[serverUid]?.url ?? '',
                    uid: serverUid,
                  }"
                  @click="handleNavigation($event, serverUid, collection.uid)"
                  @delete="handleDelete" />
                <ScalarButton
                  v-if="Object.keys(collection['servers'] || {}).length === 0"
                  class="text-c-1 hover:bg-b-2 mb-[.5px] flex h-8 w-full justify-start gap-1.5 py-0 pl-6 text-xs"
                  variant="ghost"
                  @click="openCommandPaletteServer(collection.uid)">
                  <ScalarIcon
                    icon="Add"
                    size="sm" />
                  <span>Add Server</span>
                </ScalarButton>
              </div>
            </li>
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton :click="openCommandPaletteServer">
          <template #title> Add Server </template>
        </SidebarButton>
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <ServerForm v-if="hasServers" />
      <EmptyState v-else />
    </ViewLayoutContent>
  </ViewLayout>
</template>
