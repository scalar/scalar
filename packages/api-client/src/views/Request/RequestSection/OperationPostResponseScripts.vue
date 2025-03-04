<script setup lang="ts">
import type { Operation } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import PostResponseScripts from './components/PostResponseScripts.vue'
import type { PostResponseScript } from './types/post-response'

const { operation } = defineProps<{
  operation: Operation
}>()

const { requestMutators } = useWorkspace()
const { activeEnvironment, activeEnvVariables, activeWorkspace } =
  useActiveEntities()

const scripts = computed(
  () => (operation['x-post-response'] || []) as PostResponseScript[],
)

const updateScripts = (newScripts: PostResponseScript[] | undefined) => {
  requestMutators.edit(operation.uid, 'x-post-response', newScripts || [])
}
</script>

<template>
  <ViewLayoutCollapse
    class="group/preview w-full border-b-0"
    :defaultOpen="false">
    <template #title>Post Response Scripts</template>
    <PostResponseScripts
      v-if="activeEnvironment && activeWorkspace"
      :envVariables="activeEnvVariables"
      :environment="activeEnvironment"
      :onUpdate="updateScripts"
      :scripts="scripts"
      :workspace="activeWorkspace" />
  </ViewLayoutCollapse>
</template>
