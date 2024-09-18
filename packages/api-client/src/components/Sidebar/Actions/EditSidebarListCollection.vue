<script setup lang="ts">
import IconSelector from '@/components/IconSelector.vue'
import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'
import { ScalarButton, ScalarTextField } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import { ref } from 'vue'

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
    <div class="grid gap-2 grid-cols-[auto,1fr]">
      <div class="flex aspect-square">
        <IconSelector
          v-model="newIcon"
          placement="bottom-start">
          <ScalarButton
            class="aspect-square px-0 h-auto"
            variant="outlined">
            <LibraryIcon
              class="size-4 text-c-2"
              :src="newIcon" />
          </ScalarButton>
        </IconSelector>
      </div>
      <ScalarTextField
        v-model="newName"
        autofocus
        class="flex-1" />
    </div>
  </SidebarListElementForm>
</template>
