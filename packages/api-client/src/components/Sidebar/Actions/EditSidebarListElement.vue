<script setup lang="ts">
import { ScalarTextInput } from '@scalar/components'
import { ref } from 'vue'

import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'

const props = defineProps<{
  name: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', newName: string): void
}>()

const newName = ref(props.name)
</script>
<template>
  <SidebarListElementForm
    @cancel="emit('close')"
    @submit="emit('edit', newName)">
    <ScalarTextInput
      v-model="newName"
      autofocus />
  </SidebarListElementForm>
</template>
