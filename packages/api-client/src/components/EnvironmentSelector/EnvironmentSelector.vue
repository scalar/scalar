<script setup lang="ts">
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

import { useLayout } from '@/hooks'
import { PathId } from '@/routes'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

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

const redirectToEnvironments = () =>
  router.push({
    name: 'environment.default',
    params: {
      [PathId.Workspace]: activeWorkspace.value?.uid,
    },
  })

const selectedEnvironment = computed(() => {
  const { value: environment } = activeEnvironment
  const { value: collection } = activeCollection
  return (
    environment?.name ||
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

const selectLatestEnvironment = () => {
  const environments = availableEnvironments.value
  if (environments.length > 0) {
    // Get the latest created collection environment
    const latestEnvironment = environments[environments.length - 1]

    if (latestEnvironment?.uid) {
      updateSelected(latestEnvironment.uid)
    }
  }
}

// Select for the collection its latest environment on creation
watch(availableEnvironments, (newEnvs, oldEnvs) => {
  if (newEnvs.length > oldEnvs.length) {
    selectLatestEnvironment()
  }
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
  <ScalarDropdown teleport>
    <ScalarButton
      class="text-c-1 hover:bg-b-2 line-clamp-1 h-auto w-fit justify-start px-1.5 py-1.5 font-normal"
      fullWidth
      variant="ghost">
      <h2 class="m-0 flex items-center gap-1.5 font-medium whitespace-nowrap">
        {{ selectedEnvironment }}
      </h2>
    </ScalarButton>
    <!-- Workspace list -->
    <template #items>
      <ScalarDropdownItem
        v-for="environment in availableEnvironments"
        :key="environment.uid"
        class="group/item flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
        @click.stop="updateSelected(environment.uid)">
        <ScalarListboxCheckbox
          :selected="
            activeCollection?.['x-scalar-active-environment'] ===
            environment.uid
          " />
        {{ environment.name }}
      </ScalarDropdownItem>
      <ScalarDropdownItem
        class="group/item flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
        @click.stop="updateSelected('')">
        <ScalarListboxCheckbox
          :selected="
            (activeEnvironment?.uid === '' &&
              activeCollection?.['x-scalar-active-environment'] === '') ||
            activeEnvironment?.name === 'No Environment'
          " />
        No Environment
      </ScalarDropdownItem>
      <ScalarDropdownDivider />
      <!-- Manage environments -->
      <ScalarDropdownItem
        v-if="layout !== 'modal'"
        class="flex items-center gap-1.5"
        @click="redirectToEnvironments">
        <div class="flex h-4 w-4 items-center justify-center">
          <ScalarIcon
            icon="Brackets"
            size="sm" />
        </div>
        <span class="leading-none">Manage Environments</span>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
