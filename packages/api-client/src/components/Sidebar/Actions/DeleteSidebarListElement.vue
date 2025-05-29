<script setup lang="ts">
import { computed } from 'vue'

import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'

const props = defineProps<{
  variableName: string
  warningMessage: string | undefined
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

const truncatedName = computed(() => {
  if (props.variableName.length > 18) {
    return props.variableName.slice(0, 18) + '…'
  }
  return props.variableName
})
</script>
<template>
  <SidebarListElementForm
    danger
    :label="`Delete ${truncatedName}`"
    @cancel="emit('close')"
    @submit="emit('delete')">
    <p
      v-if="warningMessage"
      class="text-c-2 text-sm leading-normal text-pretty">
      {{ warningMessage }}
    </p>
  </SidebarListElementForm>
</template>
