<script setup lang="ts">
import type { Operation } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import { ViewLayoutCollapse } from '@/components/ViewLayout'

import ExampleScripts from './ExampleScripts.vue'
import ScriptEditor from './ScriptEditor.vue'

const { operation } = defineProps<{
  operation: Pick<Operation, 'uid' | 'x-post-response'>
}>()

const emit = defineEmits<{
  (e: 'update:operation', key: keyof Operation, value: string): void
}>()

const script = computed(() => (operation['x-post-response'] as string) || '')

const updatePostResponseScript = (value: string) => {
  emit('update:operation', 'x-post-response', value)
}
</script>

<template>
  <div class="w-full">
    <ViewLayoutCollapse
      class="w-full"
      :defaultOpen="true">
      <template #title>Scripts</template>
      <template #suffix>
        <!-- Show an indicator whether we have a script -->
        <div class="mr-2">
          <div
            v-if="script.length > 0"
            class="bg-green h-2 w-2 rounded-full" />
        </div>
      </template>

      <div class="text-c-3 flex h-8 items-center border-y px-3 text-sm">
        Post-Response
      </div>

      <ScriptEditor
        :modelValue="script"
        @update:modelValue="updatePostResponseScript" />

      <div class="border-y p-3">
        <ExampleScripts
          :modelValue="script"
          @update:modelValue="updatePostResponseScript" />
      </div>
    </ViewLayoutCollapse>
  </div>
</template>
