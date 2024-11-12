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
import { ScalarButton, ScalarIcon, useModal } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import { nanoid } from 'nanoid'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EnvironmentColorModal from './EnvironmentColorModal.vue'
import EnvironmentModal from './EnvironmentModal.vue'

const router = useRouter()
const route = useRoute()
const {
  environments,
  environmentMutators,
  events,
  activeWorkspaceCollections,
} = useWorkspace()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()
const colorModal = useModal()
const environmentModal = useModal()

const activeEnvironmentID = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const isEditingName = ref(false)
const colorModalEnvironment = ref<string | null>(null)
const selectedColor = ref('')

const parseEnvironmentValue = (value: string): Record<string, string> =>
  JSON.parse(value)

const stringifyEnvironmentValue = (value: Record<string, string>): string =>
  JSON.stringify(value, null, 2)

function addEnvironment(environment: { name: string; color: string }) {
  const existingEnvironment = environments[Object.keys(environments)[0]]
  const defaultKeys = existingEnvironment
    ? Object.keys(parseEnvironmentValue(existingEnvironment.value))
    : []

  const newEnvironmentValue = defaultKeys.reduce(
    (acc, key) => {
      acc[key] = ''
      return acc
    },
    {} as Record<string, string>,
  )

  const newEnvironment = environmentSchema.parse({
    name: environment.name,
    uid: nanoid(),
    color: environment.color,
    value: stringifyEnvironmentValue(newEnvironmentValue),
    isDefault: false,
  })

  environmentMutators.add(newEnvironment)
  activeEnvironmentID.value = newEnvironment.uid
  router.push(activeEnvironmentID.value)
  environmentModal.hide()
}

function synchronizeKeys(newKey: string) {
  Object.values(environments).forEach((env) => {
    const envValue = parseEnvironmentValue(env.value)
    if (!(newKey in envValue)) {
      envValue[newKey] = ''
      environmentMutators.edit(
        env.uid,
        'value',
        stringifyEnvironmentValue(envValue),
      )
    }
  })
}

function synchronizeKeyRemoval(removedKey: string) {
  Object.values(environments).forEach((env) => {
    const envValue = parseEnvironmentValue(env.value)
    if (removedKey in envValue) {
      delete envValue[removedKey]
      environmentMutators.edit(
        env.uid,
        'value',
        stringifyEnvironmentValue(envValue),
      )
    }
  })
}

function handleEnvironmentUpdate(raw: string) {
  if (activeEnvironmentID.value) {
    const updatedValue = parseEnvironmentValue(raw)

    const currentValue = parseEnvironmentValue(
      environments[activeEnvironmentID.value].value,
    )

    Object.keys(updatedValue).forEach((key) => {
      if (!(key in currentValue)) {
        synchronizeKeys(key)
      }
    })

    Object.keys(currentValue).forEach((key) => {
      if (!(key in updatedValue)) {
        synchronizeKeyRemoval(key)
      }
    })

    environmentMutators.edit(activeEnvironmentID.value, 'value', raw)
  }
}

const removeEnvironment = (uid: string) => {
  environmentMutators.delete(uid)

  if (activeEnvironmentID.value === uid) {
    const remainingEnvironments = Object.values(environments)

    if (remainingEnvironments.length > 0) {
      // Redirect to the last environment
      const lastEnvironment =
        remainingEnvironments[remainingEnvironments.length - 1]

      activeEnvironmentID.value = lastEnvironment.uid

      router.push({
        name: 'environment',
        params: { environment: lastEnvironment.uid },
      })
    } else {
      // Redirect to the default environment
      activeEnvironmentID.value = environments.default.uid

      router.push({ name: 'environment', params: { environment: 'default' } })
    }
  }
}

const handleOpenColorModal = (uid: string) => {
  colorModalEnvironment.value = uid
  selectedColor.value = environments[uid].color || ''
  colorModal.show()
}

const submitColorChange = (color: string) => {
  if (colorModalEnvironment.value) {
    environmentMutators.edit(colorModalEnvironment.value, 'color', color)
    colorModal.hide()
  }
}

/** set active environment based on the route */
const setActiveEnvironment = () => {
  const routeEnvironmentId = router.currentRoute.value.params
    .environment as string
  if (routeEnvironmentId) {
    activeEnvironmentID.value = routeEnvironmentId
  } else if (routeEnvironmentId === 'default') {
    activeEnvironmentID.value = environments.default.uid
  }
}

/** display a focused input to edit environment name */
const enableNameEditing = () => {
  if (
    activeEnvironmentID.value &&
    !environments[activeEnvironmentID.value].isDefault
  ) {
    isEditingName.value = true
    nextTick(() => {
      nameInputRef.value?.focus()
    })
  }
}

const updateEnvironmentName = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newName = target.value
  if (
    activeEnvironmentID.value &&
    !environments[activeEnvironmentID.value].isDefault
  ) {
    environmentMutators.edit(activeEnvironmentID.value, 'name', newName)
  }
}

const showChildren = (key: string) => {
  return collapsedSidebarFolders[key]
}

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew && route.name === 'environment') {
    addEnvironment({ name: '', color: '' })
  }
}

const openEnvironmentModal = () => {
  environmentModal.show()
}

watch(
  () => route.params.environment,
  (newEnvironmentId) =>
    (activeEnvironmentID.value =
      (newEnvironmentId as string) || environments.default.uid),
)

onMounted(() => {
  setActiveEnvironment()
  events.hotKeys.on(handleHotKey)
  // TODO: open folder according to the environment
  collapsedSidebarFolders.global = true
})
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
</script>
<template>
  <ViewLayout>
    <Sidebar title="Collections">
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <div class="flex flex-col gap-0.25">
              <button
                class="flex font-medium gap-1.5 group items-center px-2 py-1.5 text-left text-sm w-full break-words rounded hover:bg-b-2"
                type="button"
                @click="toggleSidebarFolder('global')">
                <ScalarIcon
                  class="text-sidebar-c-2 size-3.5 stroke-[2.25] group-hover:hidden"
                  icon="Globe" />
                <ScalarIcon
                  class="text-c-3 hidden group-hover:block"
                  :class="{
                    'rotate-90': collapsedSidebarFolders['global'],
                  }"
                  icon="ChevronRight"
                  size="sm"
                  thickness="2.5" />
                Global
              </button>
              <div
                v-show="showChildren('global')"
                class="before:bg-border before:pointer-events-none before:z-1 before:absolute before:left-[calc(1rem_-_1.5px)] before:top-0 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] mb-[.5px] last:mb-0 relative">
                <SidebarListElement
                  v-for="environment in environments"
                  :key="environment.uid"
                  class="text-xs [&>a]:pl-5"
                  :isCopyable="false"
                  :variable="{
                    name: environment.name,
                    uid: environment.uid,
                    color: environment.color,
                    isDefault: environment.isDefault,
                  }"
                  :warningMessage="`Are you sure you want to delete this environment?`"
                  @colorModal="handleOpenColorModal"
                  @delete="removeEnvironment(environment.uid)" />
              </div>
            </div>
            <div
              v-for="collection in activeWorkspaceCollections"
              :key="collection.uid">
              <button
                v-if="collection.info?.title !== 'Drafts'"
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
                v-if="collection.info?.title !== 'Drafts'"
                v-show="showChildren(collection.uid)"
                class="before:bg-border before:pointer-events-none before:z-1 before:absolute before:left-[calc(1rem_-_1.5px)] before:top-0 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] mb-[.5px] last:mb-0 relative">
                <!-- TODO: add collection environment list -->
                <ScalarButton
                  class="mb-[.5px] flex gap-1.5 h-8 text-c-1 justify-start text-xs w-full hover:bg-b-2"
                  variant="ghost"
                  @click="openEnvironmentModal">
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
          v-if="activeEnvironmentID"
          #title>
          <span
            v-if="!isEditingName || environments[activeEnvironmentID].isDefault"
            @dblclick="enableNameEditing">
            {{ environments[activeEnvironmentID].name }}
          </span>
          <input
            v-else
            ref="nameInputRef"
            class="ring-1 ring-offset-4 ring-b-outline rounded"
            spellcheck="false"
            type="text"
            :value="environments[activeEnvironmentID].name"
            @blur="isEditingName = false"
            @input="updateEnvironmentName"
            @keyup.enter="isEditingName = false" />
        </template>
        <CodeInput
          v-if="activeEnvironmentID"
          class="pl-px pr-2 md:px-4 py-2"
          isCopyable
          language="json"
          lineNumbers
          lint
          :modelValue="environments[activeEnvironmentID].value"
          @update:modelValue="handleEnvironmentUpdate" />
      </ViewLayoutSection>
    </ViewLayoutContent>
    <EnvironmentColorModal
      :selectedColor="selectedColor"
      :state="colorModal"
      @cancel="colorModal.hide()"
      @submit="submitColorChange" />
    <EnvironmentModal
      :state="environmentModal"
      @cancel="environmentModal.hide()"
      @submit="addEnvironment" />
  </ViewLayout>
</template>
