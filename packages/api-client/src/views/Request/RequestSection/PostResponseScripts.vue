<script setup lang="ts">
import type { Operation } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import ScriptEditor from './components/ScriptEditor.vue'

const { operation } = defineProps<{
  operation: Operation
}>()

const { requestMutators } = useWorkspace()
const { activeEnvironment, activeWorkspace } = useActiveEntities()

const script = computed(() => (operation['x-post-response'] as string) || '')

const updatePostResponseScript = (value: string) => {
  requestMutators.edit(operation.uid, 'x-post-response', value)
}
</script>

<template>
  <div
    v-if="activeEnvironment && activeWorkspace"
    class="w-full">
    <ViewLayoutCollapse
      class="w-full"
      :defaultOpen="true">
      <template #title>Scripts</template>
      <template #actions>
        <!-- Show an indicator whether we have a script -->
        <div class="mr-2">
          <div
            v-if="script.length > 0"
            class="bg-green h-2 w-2 rounded-full" />
        </div>
      </template>

      <div class="border-t p-2">
        <div class="text-c-3 pb-2 text-sm">Post-Response</div>

        <ScriptEditor
          :modelValue="script"
          @update:modelValue="updatePostResponseScript" />
      </div>
    </ViewLayoutCollapse>
  </div>
</template>
