<script setup lang="ts">
import { ScalarButton, ScalarTextInput } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import { ref } from 'vue'

import IconSelector from '@/components/IconSelector.vue'
import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'

const props = defineProps<{
  name: string
  icon: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', newName: string, newIcon: string): void
}>()

const newName = ref(props.name)
const newIcon = ref(props.icon)
</script>
<template>
  <SidebarListElementForm
    @cancel="emit('close')"
    @submit="emit('edit', newName, newIcon)">
    <div class="grid grid-cols-[auto_1fr] gap-2">
      <div class="flex aspect-square">
        <IconSelector
          v-model="newIcon"
          placement="bottom-start">
          <ScalarButton
            class="aspect-square h-auto px-0"
            variant="outlined">
            <LibraryIcon
              class="text-c-2 size-4"
              :src="newIcon" />
          </ScalarButton>
        </IconSelector>
      </div>
      <ScalarTextInput
        v-model="newName"
        autofocus
        class="flex-1" />
    </div>
  </SidebarListElementForm>
</template>
