<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useSidebar } from '@/hooks'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarButton, ScalarIcon, useModal } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EnvironmentColorModal from './EnvironmentColorModal.vue'
import EnvironmentModal from './EnvironmentModal.vue'

const router = useRouter()
const route = useRoute()
const { activeWorkspace, activeEnvironment, activeWorkspaceCollections } =
  useActiveEntities()
const { events, workspaceMutators, collectionMutators } = useWorkspace()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()
const colorModal = useModal()
const environmentModal = useModal()

const nameInputRef = ref<HTMLInputElement | null>(null)
const isEditingName = ref(false)
const colorModalEnvironment = ref<string | null>(null)
const currentEnvironmentId = ref('default')
const selectedColor = ref('')
const selectedCollectionId = ref<string | undefined>(undefined)

const parseEnvironmentValue = (value: string): Record<string, string> =>
  JSON.parse(value)

function addEnvironment(environment: {
  name: string
  color: string
  collectionId?: string
}) {
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
        collectionId: environment.collectionId,
        environmentId: environment.name,
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
        activeWorkspace.value.uid,
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
        collection['x-scalar-environments'][
          currentEnvironmentId.value ?? ''
        ].variables = updatedValue
        collectionMutators.edit(
          collection.uid,
          'x-scalar-environments',
          collection['x-scalar-environments'],
        )
      }
    }
  }
}

const updateEnvironmentName = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newName = target.value
  if (currentEnvironmentId.value !== 'default') {
    activeWorkspaceCollections.value.forEach((collection) => {
      if (
        collection['x-scalar-environments']?.[currentEnvironmentId.value ?? '']
      ) {
        const env =
          collection['x-scalar-environments'][currentEnvironmentId.value ?? '']
        delete collection['x-scalar-environments'][
          currentEnvironmentId.value ?? ''
        ]
        collection['x-scalar-environments'][newName] = env
        collectionMutators.edit(
          collection.uid,
          'x-scalar-environments',
          collection['x-scalar-environments'],
        )
      }
    })
    currentEnvironmentId.value = newName
  }
}

const openEnvironmentModal = (collectionId?: string) => {
  selectedCollectionId.value = collectionId
  environmentModal.show()
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

/** display a focused input to edit environment name */
const enableNameEditing = () => {
  if (currentEnvironmentId.value !== 'default') {
    isEditingName.value = true
    nextTick(() => {
      nameInputRef.value?.focus()
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
    ? JSON.stringify(activeWorkspace.value.environments, null, 2)
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
  () => [route.params.collectionId, route.params.environmentId],
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
    (route.params.environmentId as string) || 'default'
  events.hotKeys.on(handleHotKey)
  const { collectionId } = router.currentRoute.value.params
  if (collectionId && !collapsedSidebarFolders[collectionId as string]) {
    toggleSidebarFolder(collectionId as string)
  }
})
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
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
              :variable="{
                name: 'Global Environment',
                uid: 'default',
                icon: 'Globe',
                isDefault: true,
              }" />
            <div
              v-for="collection in activeWorkspaceCollections"
              :key="collection.uid"
              class="flex flex-col gap-0.25">
              <button
                class="flex font-medium gap-1.5 group items-center px-2 py-1.5 text-left text-sm w-full break-words rounded hover:bg-b-2"
                type="button"
                @click="toggleSidebarFolder(collection.uid)">
                <LibraryIcon
                  class="text-sidebar-c-2 size-3.5 stroke-[2.25] group-hover:hidden"
                  :src="
                    collection['x-scalar-icon'] || 'interface-content-folder'
                  " />
                <ScalarIcon
                  class="text-c-3 hidden text-sm group-hover:block"
                  :class="{
                    'rotate-90': collapsedSidebarFolders[collection.uid],
                  }"
                  icon="ChevronRight"
                  size="sm"
                  thickness="2.5" />
                {{ collection.info?.title ?? '' }}
              </button>
              <div
                v-show="showChildren(collection.uid)"
                :class="{
                  'before:bg-border before:pointer-events-none before:z-1 before:absolute before:left-[calc(1rem_-_1.5px)] before:top-0 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] flex flex-col gap-px mb-[.5px] last:mb-0 relative':
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
                  :variable="{
                    name: environmentName,
                    uid: environmentName,
                    color: environment.color ?? '#8E8E8E',
                    isDefault: false,
                  }"
                  :warningMessage="`Are you sure you want to delete this environment?`"
                  @colorModal="handleOpenColorModal(environmentName)"
                  @delete="removeCollectionEnvironment(environmentName)" />
                <ScalarButton
                  v-if="
                    Object.keys(collection['x-scalar-environments'] || {})
                      .length === 0
                  "
                  class="mb-[.5px] flex gap-1.5 h-8 text-c-1 pl-6 py-0 justify-start text-xs w-full hover:bg-b-2"
                  variant="ghost"
                  @click="openEnvironmentModal(collection.uid)">
                  <ScalarIcon
                    class="ml-0.5 h-2.5 w-2.5"
                    icon="Add"
                    thickness="3" />
                  <span>Add Environment</span>
                </ScalarButton>
              </div>
            </div>
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton
          :click="openEnvironmentModal"
          hotkey="N">
          <template #title>Add Environment</template>
        </SidebarButton>
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <ViewLayoutSection>
        <template
          v-if="currentEnvironmentId"
          #title>
          <span
            v-if="!isEditingName || currentEnvironmentId === 'default'"
            @dblclick="enableNameEditing">
            {{ getEnvironmentName() }}
          </span>
          <input
            v-else
            ref="nameInputRef"
            class="ring-1 ring-offset-4 ring-b-outline rounded"
            spellcheck="false"
            type="text"
            :value="getEnvironmentName()"
            @blur="isEditingName = false"
            @input="updateEnvironmentName"
            @keyup.enter="isEditingName = false" />
        </template>
        <CodeInput
          v-if="currentEnvironmentId"
          class="pl-px pr-2 md:px-4 py-2"
          isCopyable
          language="json"
          lineNumbers
          lint
          :modelValue="getEnvironmentValue()"
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
  </ViewLayout>
</template>
