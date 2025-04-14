<script setup lang="ts">
import { ScalarToggle } from '@scalar/components'

import { useActiveEntities } from '@/store/active-entities'
import { useWorkspace } from '@/store/store'
import { RequestAuth } from '@/views/Request/RequestSection/RequestAuth'

const {
  activeCollection,
  activeEnvVariables,
  activeEnvironment,
  activeServer,
  activeWorkspace,
} = useActiveEntities()

const { collectionMutators } = useWorkspace()

/** Toggle the collection security */
const handleToggleCollectionSecurity = () => {
  if (!activeCollection.value?.uid) {
    return
  }

  collectionMutators.edit(
    activeCollection.value.uid,
    'useCollectionSecurity',
    !activeCollection.value.useCollectionSecurity,
  )
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-12 px-1.5 pt-8">
    <div class="flex flex-col gap-4">
      <div class="flex h-8 items-center">
        <h3 class="font-bold">Authenticate with the API once</h3>
      </div>

      <div class="bg-b-1 flex items-center justify-between gap-4 text-sm">
        <p class="text-c-2 flex flex-1 text-balance">
          Don’t want to set up the authentication for each request? Enable this
          option to set the authentication once for the whole collection.
        </p>
        <ScalarToggle
          class="w-4"
          :modelValue="activeCollection?.useCollectionSecurity ?? false"
          @update:modelValue="handleToggleCollectionSecurity" />
      </div>

      <RequestAuth
        class="scalar-collection-auth"
        :class="
          !activeCollection?.useCollectionSecurity &&
          'pointer-events-none opacity-50 mix-blend-luminosity'
        "
        v-if="activeCollection && activeWorkspace"
        :collection="activeCollection"
        :envVariables="activeEnvVariables"
        :environment="activeEnvironment"
        layout="reference"
        :selectedSecuritySchemeUids="
          activeCollection?.selectedSecuritySchemeUids ?? []
        "
        :server="activeServer"
        title="Authentication"
        :workspace="activeWorkspace" />
    </div>
  </div>
</template>

<style scoped>
.scalar-collection-auth {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
}
</style>
