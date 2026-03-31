<script setup lang="ts">
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import ScriptEditor from '@/components/ScriptEditor.vue'
import { ViewLayoutCollapse } from '@/components/ViewLayout'

import ExampleScripts from './ExampleScripts.vue'

const { operation } = defineProps<{
  operation?: Pick<OperationObject, 'x-post-response'>
}>()

const emit = defineEmits<{
  (e: 'operation:update:extension', payload: any): void
}>()

const script = computed(() => (operation?.['x-post-response'] as string) ?? '')

const updatePostResponseScript = (value: string) => {
  emit('operation:update:extension', {
    'x-post-response': value,
  })
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
