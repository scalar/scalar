<script setup lang="ts">
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { computed } from 'vue'

import ScriptEditor from '@/components/ScriptEditor.vue'
import { ViewLayoutCollapse } from '@/components/ViewLayout'

const { operation } = defineProps<{
  operation?: Pick<OperationObject, 'x-pre-request'>
}>()

const emit = defineEmits<{
  (e: 'operation:update:extension', payload: any): void
}>()

const script = computed(() => (operation?.['x-pre-request'] as string) ?? '')

const updatePreRequestScript = (value: string) => {
  emit('operation:update:extension', {
    'x-pre-request': value,
  })
}
</script>

<template>
  <div class="w-full">
    <ViewLayoutCollapse
      class="w-full"
      :defaultOpen="true">
      <template #title>Pre-Request</template>
      <template #suffix>
        <div class="mr-2">
          <div
            v-if="script.length > 0"
            class="bg-green h-2 w-2 rounded-full" />
        </div>
      </template>

      <div class="text-c-3 flex h-8 items-center border-y px-3 text-sm">
        Pre-request scripts run before the request is sent. Use them to set
        variables or modify the request.
      </div>

      <ScriptEditor
        :modelValue="script"
        @update:modelValue="updatePreRequestScript" />
    </ViewLayoutCollapse>
  </div>
</template>
