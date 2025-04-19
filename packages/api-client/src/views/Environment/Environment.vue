<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CodeInput from '@/components/CodeInput/CodeInput.vue'
import EditSidebarListElement from '@/components/Sidebar/Actions/EditSidebarListElement.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useSidebar } from '@/hooks/useSidebar'
import type { HotKeyEvent } from '@/libs'
import { PathId } from '@/routes'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import EnvironmentColorModal from './EnvironmentColorModal.vue'
import EnvironmentModal from './EnvironmentModal.vue'

const router = useRouter()
const route = useRoute()
const {
  activeWorkspace,
  activeEnvironment,
  activeWorkspaceCollections,
  activeEnvVariables,
} = useActiveEntities()
const { events, workspaceMutators, collectionMutators } = useWorkspace()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()
const colorModal = useModal()
const environmentModal = useModal()

const editModal = useModal()

const colorModalEnvironment = ref<string | null>(null)
const currentEnvironmentId = ref('default')
const selectedColor = ref('')
const selectedCollectionId = ref<string | undefined>(undefined)
const selectedEnvironmentId = ref<string | undefined>(undefined)
const tempEnvironmentName = ref<string | undefined>(undefined)

const { toast } = useToasts()

const parseEnvironmentValue = (value: string): Record<string, string> =>
  JSON.parse(value)

function environmentNameToast(
  environmentNameUsed: boolean,
  collection: any,
  collectionId: string | undefined,
) {
  if (environmentNameUsed) {
    if (collection.uid === collectionId) {
      toast(
        `Environment name already used in ${collection.info?.title}`,
        'error',
      )
    } else {
      toast('Environment name already used in another collection', 'error')
    }
  }
}

function addEnvironment(environment: {
  name: string
  color: string
  collectionId: Collection['uid'] | undefined
}) {
  const environmentNameUsed = activeWorkspaceCollections.value.some(
    (collection) => {
      const enviromentName = Object.keys(
        collection['x-scalar-environments'] || {},
      ).includes(environment.name)
      environmentNameToast(enviromentName, collection, environment.collectionId)
      return enviromentName
    },
  )
  if (environmentNameUsed) {
    return
  }
  if (environment.collectionId) {
    collectionMutators.addEnvironment(
      environment.name,
      {
        variables: {},
        color: environment.color,
      },
      environment.collectionId,
    )
    if (!collapsedSidebarFolders[environment.collectionId]) {
      toggleSidebarFolder(environment.collectionId)
    }
    router.push({
      name: 'environment.collection',
      params: {
        [PathId.Collection]: environment.collectionId,
        [PathId.Environment]: environment.name,
      },
    })
  }

  environmentModal.hide()
}

function handleEnvironmentUpdate(raw: string) {
  if (activeEnvironment) {
    const updatedValue = parseEnvironmentValue(raw)

    if (currentEnvironmentId.value === 'default') {
      workspaceMutators.edit(
        activeWorkspace.value?.uid,
        'environments',
        updatedValue,
      )
    } else {
      const collection = activeWorkspaceCollections.value.find(
        (c) => c['x-scalar-environments']?.[currentEnvironmentId.value ?? ''],
      )
      if (
        collection?.['x-scalar-environments']?.[
          currentEnvironmentId.value ?? ''
        ]
      ) {
        const environment =
          collection['x-scalar-environments'][currentEnvironmentId.value ?? '']
        if (environment) {
          environment.variables = updatedValue
          collectionMutators.edit(
            collection.uid,
            'x-scalar-environments',
            collection['x-scalar-environments'],
          )
        }
      }
    }
  }
}

const openEnvironmentModal = (collectionId?: string) => {
  selectedCollectionId.value = collectionId
  environmentModal.show()
}

const openRenameModal = (environmentId: string, collectionId: string) => {
  selectedEnvironmentId.value = environmentId
  selectedCollectionId.value = collectionId
  tempEnvironmentName.value = environmentId
  editModal.show()
}

const handleOpenColorModal = (uid: string) => {
  colorModalEnvironment.value = uid
  selectedColor.value =
    activeWorkspaceCollections.value.find(
      (collection) => collection['x-scalar-environments']?.[uid],
    )?.['x-scalar-environments']?.[uid]?.color ?? ''
  colorModal.show()
}

const submitColorChange = (color: string) => {
  const environmentId = colorModalEnvironment.value
  if (typeof environmentId === 'string') {
    const isCollection = activeWorkspaceCollections.value.some(
      (collection) => collection['x-scalar-environments']?.[environmentId],
    )
    if (isCollection) {
      activeWorkspaceCollections.value.forEach((collection) => {
        if (collection['x-scalar-environments']?.[environmentId]) {
          collection['x-scalar-environments'][environmentId].color = color
          collectionMutators.edit(
            collection.uid,
            'x-scalar-environments',
            collection['x-scalar-environments'],
          )
        }
      })
    }
    colorModal.hide()
  }
}

function removeCollectionEnvironment(environmentName: string) {
  activeWorkspaceCollections.value.forEach((collection) => {
    collectionMutators.removeEnvironment(environmentName, collection.uid)
  })

  // Redirect to last available environment
  const remainingCollectionEnvironments =
    activeWorkspaceCollections.value.flatMap((collection) =>
      Object.keys(collection['x-scalar-environments'] || {}),
    )

  if (remainingCollectionEnvironments.length > 0) {
    const lastCollectionEnvironment =
      remainingCollectionEnvironments[
        remainingCollectionEnvironments.length - 1
      ]

    if (!lastCollectionEnvironment) {
      return
    }

    const currentCollection = activeWorkspaceCollections.value.find(
      (collection) =>
        Object.keys(collection['x-scalar-environments'] || {}).includes(
          lastCollectionEnvironment,
        ),
    )
    currentEnvironmentId.value = lastCollectionEnvironment
    router.push({
      name: 'environment.collection',
      params: {
        collectionId: currentCollection?.uid,
        environmentId: lastCollectionEnvironment,
      },
    })
    if (currentCollection && !collapsedSidebarFolders[currentCollection.uid]) {
      toggleSidebarFolder(currentCollection.uid)
    }
  } else {
    currentEnvironmentId.value = 'default'
    router.push({
      name: 'environment',
      params: { environment: 'default' },
    })
  }
}

const getEnvironmentName = () => {
  return currentEnvironmentId.value === 'default'
    ? 'Global Environment'
    : currentEnvironmentId.value
}

const getEnvironmentValue = () => {
  return currentEnvironmentId.value === 'default'
    ? JSON.stringify(activeWorkspace.value?.environments, null, 2)
    : JSON.stringify(
        activeWorkspaceCollections.value.find(
          (collection) =>
            collection['x-scalar-environments']?.[
              currentEnvironmentId.value ?? ''
            ],
        )?.['x-scalar-environments']?.[currentEnvironmentId.value ?? '']
          ?.variables,
        null,
        2,
      )
}

const showChildren = (key: string) => {
  return collapsedSidebarFolders[key]
}

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew && route.name === 'environment') {
    openEnvironmentModal()
  }
}

watch(
  () => [route.params[PathId.Collection], route.params[PathId.Environment]],
  ([newCollectionId, newEnvironmentId]) => {
    if (newCollectionId) {
      // Collection environment
      currentEnvironmentId.value = newEnvironmentId as string
    } else {
      // Global environment
      currentEnvironmentId.value = 'default'
    }
  },
)

onMounted(() => {
  currentEnvironmentId.value =
    (route.params[PathId.Environment] as string) || 'default'
  events.hotKeys.on(handleHotKey)
  const collectionId = route.params[PathId.Collection]
  if (collectionId && !collapsedSidebarFolders[collectionId as string]) {
    toggleSidebarFolder(collectionId as string)
  }
})
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))

const handleNavigation = (
  event: MouseEvent,
  uid: string,
  collectionId?: string,
) => {
  const to = collectionId
    ? {
        name: 'environment.collection',
        params: {
          [PathId.Workspace]: activeWorkspace.value?.uid,
          [PathId.Collection]: collectionId,
          [PathId.Environment]: uid,
        },
      }
    : {
        name: 'environment.default',
        params: {
          [PathId.Workspace]: activeWorkspace.value?.uid,
          [PathId.Environment]: uid,
        },
      }
  if (event.metaKey) {
    window.open(router.resolve(to).href, '_blank')
  } else {
    router.push(to)
  }
}

function handleCancelRename() {
  selectedEnvironmentId.value = undefined
  selectedCollectionId.value = undefined
  tempEnvironmentName.value = undefined
  editModal.hide()
}

function handleRename(newName: string) {
  const environmentNameUsed = activeWorkspaceCollections.value.some(
    (collection) => {
      const enviromentName = Object.keys(
        collection['x-scalar-environments'] || {},
      ).includes(newName)
      environmentNameToast(
        enviromentName,
        collection,
        selectedCollectionId.value,
      )
      return enviromentName
    },
  )
  if (environmentNameUsed) {
    return
  }
  if (newName && selectedEnvironmentId.value !== 'default') {
    activeWorkspaceCollections.value.forEach((collection) => {
      if (
        collection['x-scalar-environments']?.[selectedEnvironmentId.value ?? '']
      ) {
        const env =
          collection['x-scalar-environments'][selectedEnvironmentId.value ?? '']
        if (env) {
          delete collection['x-scalar-environments'][
            selectedEnvironmentId.value ?? ''
          ]
          collection['x-scalar-environments'][newName] = env
          collectionMutators.edit(
            collection.uid,
            'x-scalar-environments',
            collection['x-scalar-environments'],
          )
        }
      }
    })
  }

  if (newName && currentEnvironmentId.value === selectedEnvironmentId.value) {
    currentEnvironmentId.value = newName
  }

  selectedEnvironmentId.value = undefined
  selectedCollectionId.value = undefined
  tempEnvironmentName.value = undefined
  editModal.hide()
}
</script>
<template>
  <ViewLayout>
    <Sidebar title="Collections">
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <SidebarListElement
              :key="'default'"
              class="text-xs"
              :isCopyable="false"
              :to="{
                name: 'environment.default',
                params: {
                  [PathId.Environment]: 'default',
                },
              }"
              type="environment"
              :variable="{
                name: 'Global Environment',
                uid: 'default',
                icon: 'Globe',
                isDefault: true,
              }" />
            <li
              v-for="collection in activeWorkspaceCollections"
              :key="collection.uid"
              class="gap-1/2 flex flex-col">
              <button
                class="hover:bg-b-2 group flex w-full items-center gap-1.5 break-words rounded p-1.5 text-left text-sm font-medium"
                type="button"
                @click="toggleSidebarFolder(collection.uid)">
                <span class="flex h-5 max-w-[14px] items-center justify-center">
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
                {{ collection.info?.title ?? '' }}
              </button>
              <div
                v-show="showChildren(collection.uid)"
                :class="{
                  'before:bg-border before:z-1 relative mb-[.5px] before:pointer-events-none before:absolute before:left-3 before:top-0 before:h-[calc(100%_+_.5px)] before:w-[.5px] last:mb-0 last:before:h-full':
                    Object.keys(collection['x-scalar-environments'] || {})
                      .length > 0,
                }">
                <SidebarListElement
                  v-for="(environment, environmentName) in collection[
                    'x-scalar-environments'
                  ]"
                  :key="environmentName"
                  class="text-xs [&>a]:pl-5"
                  :collectionId="collection.uid"
                  :isCopyable="false"
                  :isDeletable="true"
                  :isRenameable="true"
                  :to="{
                    name: 'collection.environment',
                    params: {
                      [PathId.Collection]: collection.uid,
                      [PathId.Environment]: environmentName,
                    },
                  }"
                  type="environment"
                  :variable="{
                    name: environmentName,
                    uid: environmentName,
                    color: environment.color ?? '#8E8E8E',
                    isDefault: false,
                  }"
                  :warningMessage="`Are you sure you want to delete this environment?`"
                  @click.prevent="
                    handleNavigation($event, environmentName, collection.uid)
                  "
                  @colorModal="handleOpenColorModal(environmentName)"
                  @delete="removeCollectionEnvironment(environmentName)"
                  @rename="openRenameModal(environmentName, collection.uid)" />
                <ScalarButton
                  v-if="
                    Object.keys(collection['x-scalar-environments'] || {})
                      .length === 0
                  "
                  class="text-c-1 hover:bg-b-2 flex h-8 w-full justify-start gap-1.5 py-0 pl-6 text-xs"
                  variant="ghost"
                  @click="openEnvironmentModal(collection.uid)">
                  <ScalarIcon
                    icon="Add"
                    size="sm" />
                  <span>Add Environment</span>
                </ScalarButton>
              </div>
            </li>
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton
          :click="openEnvironmentModal"
          hotkey="N">
          <template #title> Add Environment </template>
        </SidebarButton>
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <ViewLayoutSection>
        <template
          v-if="currentEnvironmentId"
          #title>
          <span>
            {{ getEnvironmentName() }}
          </span>
        </template>
        <CodeInput
          v-if="currentEnvironmentId && activeWorkspace"
          class="py-2 pl-px pr-2 md:px-4"
          :envVariables="activeEnvVariables"
          :environment="activeEnvironment"
          isCopyable
          language="json"
          lineNumbers
          lint
          :modelValue="getEnvironmentValue()"
          :workspace="activeWorkspace"
          @update:modelValue="handleEnvironmentUpdate" />
      </ViewLayoutSection>
    </ViewLayoutContent>
    <EnvironmentColorModal
      :selectedColor="selectedColor"
      :state="colorModal"
      @cancel="colorModal.hide()"
      @submit="submitColorChange" />
    <EnvironmentModal
      :activeWorkspaceCollections="activeWorkspaceCollections"
      :collectionId="selectedCollectionId"
      :state="environmentModal"
      @cancel="environmentModal.hide()"
      @submit="addEnvironment" />

    <ScalarModal
      :size="'xxs'"
      :state="editModal"
      :title="`Edit ${selectedEnvironmentId}`">
      <EditSidebarListElement
        :name="tempEnvironmentName ?? ''"
        @close="handleCancelRename"
        @edit="handleRename" />
    </ScalarModal>
  </ViewLayout>
</template>
