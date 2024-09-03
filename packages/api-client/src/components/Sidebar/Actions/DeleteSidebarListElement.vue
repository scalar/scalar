<script setup lang="ts">
import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'

defineProps<{
  variableName: string
  warningMessage?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()
</script>
<template>
  <SidebarListElementForm
    danger
    :label="`Delete ${variableName}`"
    @cancel="emit('close')"
    @submit="emit('delete')">
    <p
      v-if="warningMessage"
      class="text-c-3 font-medium text-xs mb-2">
      {{ warningMessage }}
    </p>
  </SidebarListElementForm>
</template>
