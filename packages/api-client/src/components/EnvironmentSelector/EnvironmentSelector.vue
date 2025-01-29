<script setup lang="ts">
import { useLayout } from '@/hooks'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarListboxCheckbox,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const { activeCollection, activeWorkspace, activeEnvironment } =
  useActiveEntities()
const { collectionMutators } = useWorkspace()
const { layout } = useLayout()

const router = useRouter()

const updateSelected = (uid: string) => {
  if (activeCollection.value && activeWorkspace.value) {
    collectionMutators.edit(
      activeCollection.value.uid,
      'x-scalar-active-environment',
      uid,
    )

    activeWorkspace.value.activeEnvironmentId = uid
  }
}
const createNewEnvironment = () =>
  router.push({
    name: 'environment',
    params: {
      environment: activeWorkspace.value?.uid,
    },
  })

const selectedEnvironment = computed(() => {
  const { value: environment } = activeEnvironment
  const { value: collection } = activeCollection
  return (
    environment?.uid ||
    collection?.['x-scalar-active-environment'] ||
    'No Environment'
  )
})

const availableEnvironments = computed(() => {
  const { value: collection } = activeCollection
  const environments = collection?.['x-scalar-environments']
  return environments
    ? Object.entries(environments).map(([key, env]) => ({
        ...env,
        uid: key,
        name: key,
      }))
    : []
})

const setInitialEnvironment = (collection: Collection) => {
  const activeEnv = collection['x-scalar-active-environment']
  if (activeEnv && activeCollection.value && activeWorkspace.value) {
    activeCollection.value['x-scalar-active-environment'] = activeEnv
    activeWorkspace.value.activeEnvironmentId = activeEnv
  } else if (activeWorkspace.value) {
    activeWorkspace.value.activeEnvironmentId = ''
  }
}

watch(
  activeCollection,
  (newCollection) => newCollection && setInitialEnvironment(newCollection),
)

onMounted(() => {
  activeCollection.value && setInitialEnvironment(activeCollection.value)
})
</script>
<template>
  <div>
    <ScalarDropdown placement="bottom-end">
      <ScalarButton
        class="font-normal h-auto justify-start py-1.5 px-1.5 pl-2 text-c-1 hover:bg-b-2 w-fit"
        fullWidth
        variant="ghost">
        <h2 class="font-medium m-0 flex gap-1.5 items-center whitespace-nowrap">
          {{ selectedEnvironment }}
        </h2>
      </ScalarButton>
      <!-- Workspace list -->
      <template #items>
        <ScalarDropdownItem
          v-for="environment in availableEnvironments"
          :key="environment.uid"
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
          @click.stop="updateSelected(environment.uid)">
          <ScalarListboxCheckbox
            :selected="
              activeCollection?.['x-scalar-active-environment'] ===
              environment.uid
            " />
          {{ environment.name }}
        </ScalarDropdownItem>
        <ScalarDropdownItem
          class="flex gap-1.5 group/item items-center whitespace-nowrap text-ellipsis overflow-hidden"
          @click.stop="updateSelected('')">
          <div
            class="flex items-center justify-center rounded-full p-[3px] w-4 h-4"
            :class="
              activeEnvironment?.uid === '' &&
              activeCollection?.['x-scalar-active-environment'] === ''
                ? 'bg-c-accent text-b-1'
                : 'shadow-border text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3" />
          </div>
          No Environment
        </ScalarDropdownItem>
        <ScalarDropdownDivider />
        <!-- Manage environments -->
        <ScalarDropdownItem
          v-if="layout !== 'modal'"
          class="flex items-center gap-1.5"
          @click="createNewEnvironment">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              icon="Brackets"
              size="sm" />
          </div>
          <span class="leading-none">Manage Environments</span>
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>
  </div>
</template>
