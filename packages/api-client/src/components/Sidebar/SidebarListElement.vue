<script setup lang="ts">
import SidebarListElementActions from '@/components/Sidebar/SidebarListElementActions.vue'
import { useRouter } from 'vue-router'

defineProps<{
  variable: {
    uid: string
    name: string
    color?: string
    isDefault?: boolean
  }
  warningMessage?: string
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'colorModal', id: string): void
}>()

const router = useRouter()

const handleNavigation = (event: MouseEvent, uid: string) => {
  if (event.metaKey) {
    window.open(uid, '_blank')
  } else {
    router.push(uid)
  }
}

const handleDelete = (id: string) => {
  emit('delete', id)
}

const handleColorClick = (uid: string) => {
  emit('colorModal', uid)
}
</script>
<template>
  <li>
    <router-link
      v-bind="$attrs"
      class="h-8 text-c-2 hover:bg-b-2 group relative block flex items-center gap-1 rounded py-1 pr-2 font-medium no-underline"
      :class="[variable.color ? 'pl-1' : 'pl-2']"
      exactActiveClass="active-link"
      :to="`${variable.uid}`"
      @click.prevent="handleNavigation($event, variable.uid)">
      <button
        v-if="variable.color"
        class="hover:bg-b-3 rounded p-1.5"
        type="button"
        @click="handleColorClick(variable.uid)">
        <div
          class="h-2.5 w-2.5 rounded-xl"
          :style="{ backgroundColor: variable.color }"></div>
      </button>
      <span class="empty-variable-name">{{ variable.name }}</span>
      <SidebarListElementActions
        :variable="{ ...variable, isDefault: variable.isDefault ?? false }"
        :warningMessage="warningMessage"
        @delete="handleDelete" />
    </router-link>
  </li>
</template>
<style scoped>
.active-link {
  @apply bg-b-2 text-c-1;
}
.empty-variable-name:empty:before {
  content: 'No Name';
  color: var(--scalar-color-3);
}
.cookie > a {
  @apply pl-10;
}
</style>
