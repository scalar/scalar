<script setup lang="ts">
import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'

const { variableName } = defineProps<{
  variableName: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

async function deleteEnvironmentVariable() {
  emit('delete')
}
</script>
<template>
  <SidebarListElementForm
    danger
    :label="`Delete ${variableName}`"
    @cancel="emit('close')"
    @submit="deleteEnvironmentVariable">
    <p>Are you sure you want to remove it?</p>
  </SidebarListElementForm>
</template>
