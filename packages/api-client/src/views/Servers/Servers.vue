<script setup lang="ts">
import { Sidebar } from '@/components'
import EmptyState from '@/components/EmptyState.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useSidebar } from '@/hooks'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ServerForm from './ServerForm.vue'

const { activeWorkspaceCollections, activeWorkspace, activeCollection } =
  useActiveEntities()
const { servers, events, serverMutators } = useWorkspace()
const { push } = useRouter()
const route = useRoute()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()

const collectionIdParam = computed(() => route.params.collectionId as string)
const serverUidParam = computed(() => route.params.servers as string)

const showChildren = (key: string) => {
  return collapsedSidebarFolders[key]
}

function openCommandPaletteServer(collectionId?: string) {
  events.commandPalette.emit({
    commandName: 'Add Server',
    metaData: { parentUid: collectionId },
  })
}

const collections = computed(() => {
  return activeWorkspaceCollections.value.filter(
    (collection: Collection) => collection.info?.title !== 'Drafts',
  )
})

const handleNavigation = (
  event: MouseEvent,
  uid: string,
  collectionId: string,
) => {
  const path = `/workspace/${activeWorkspace?.value?.uid}/servers/${collectionId}/${uid}`
  if (event.metaKey) {
    window.open(path, '_blank')
  } else {
    push({ path })
  }
}

function handleDelete(uid: string) {
  if (!activeCollection?.value?.uid) return
  serverMutators.delete(uid, collectionIdParam.value)
}

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
              class="flex flex-col gap-1/2">
              <button
                class="flex font-medium gap-1.5 group items-center p-1.5 text-left text-sm w-full break-words rounded hover:bg-b-2"
                type="button"
                @click="toggleSidebarFolder(collection.uid)">
                <span
                  class="flex h-5 items-center justify-center max-w-[14px] pr-px">
                  <LibraryIcon
                    class="min-w-3.5 text-sidebar-c-2 size-3.5 stroke-2 group-hover:hidden"
                    :src="
                      collection['x-scalar-icon'] || 'interface-content-folder'
                    " />
                  <div
                    :class="{
                      'rotate-90': collapsedSidebarFolders[collection.uid],
                    }">
                    <ScalarIcon
                      class="text-c-3 hidden text-sm group-hover:block"
                      icon="ChevronRight"
                      size="md" />
                  </div>
                </span>
                <span
                  class="break-all line-clamp-1 font-medium text-left w-full"
                  >{{ collection.info?.title ?? '' }}</span
                >
                <ScalarButton
                  class="hidden group-hover:block px-0.5 py-0 hover:bg-b-3 hover:text-c-1 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100 aspect-square h-fit"
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
                  'before:bg-border before:pointer-events-none before:z-1 before:absolute before:left-3 before:top-0 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] flex flex-col gap-1/2 mb-[.5px] last:mb-0 relative':
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
                  class="mb-[.5px] flex gap-1.5 h-8 text-c-1 pl-6 py-0 justify-start text-xs w-full hover:bg-b-2"
                  variant="ghost"
                  @click="openCommandPaletteServer(collection.uid)">
                  <ScalarIcon
                    class="ml-0.5 h-2.5 w-2.5"
                    icon="Add"
                    thickness="3" />
                  <span>Add Server</span>
                </ScalarButton>
              </div>
            </li>
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton :click="openCommandPaletteServer">
          <template #title>Add Server</template>
        </SidebarButton>
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <ServerForm
        v-if="hasServers"
        :collectionId="collectionIdParam"
        :serverUid="serverUidParam" />
      <EmptyState v-else />
    </ViewLayoutContent>
  </ViewLayout>
</template>
