<script setup lang="ts">
import SidebarListElementActions from '@/components/Sidebar/SidebarListElementActions.vue'
import { useActiveEntities } from '@/store/active-entities'
import { type Icon, ScalarIcon } from '@scalar/components'
import { useRouter } from 'vue-router'

const props = defineProps<{
  variable: {
    uid: string
    name: string
    color?: string
    icon?: Icon
    isDefault?: boolean
  }
  collectionId?: string
  warningMessage?: string
  isDeletable?: boolean
  isCopyable?: boolean
  isRenameable?: boolean
  type: 'environment' | 'cookies' | 'servers'
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'colorModal', id: string): void
  (e: 'rename', id: string): void
}>()

const router = useRouter()
const { activeWorkspace } = useActiveEntities()
const handleNavigation = (
  event: MouseEvent,
  uid: string,
  collectionId?: string,
) => {
  const params = {
    workspaceId: activeWorkspace.value?.uid,
    type: props.type,
    collectionId: collectionId || undefined,
    uid: uid,
  }
  const path = collectionId
    ? `/workspace/${params.workspaceId}/${params.type}/${params.collectionId}/${params.uid}`
    : `/workspace/${params.workspaceId}/${params.type}/${params.uid}`
  if (event.metaKey) {
    window.open(path, '_blank')
  } else {
    router.push({ path })
  }
}

const handleDelete = (id: string) => {
  emit('delete', id)
}

const handleColorClick = (uid: string) => {
  emit('colorModal', uid)
}

const handleRename = (id: string) => {
  emit('rename', id)
}
</script>
<template>
  <li>
    <!-- TODO: Use named routes instead -->
    <router-link
      class="h-8 text-c-2 hover:bg-b-2 group relative block flex items-center gap-1.5 rounded py-1 pr-1.5 font-medium no-underline"
      :class="[variable.color ? 'pl-1' : 'pl-1.5']"
      exactActiveClass="active-link"
      role="button"
      :to="
        collectionId
          ? `/workspace/${activeWorkspace?.uid}/${type}/${collectionId}/${variable.uid}`
          : `/workspace/${activeWorkspace?.uid}/${type}/${variable.uid}`
      "
      @click.prevent="handleNavigation($event, variable.uid, collectionId)">
      <button
        v-if="variable.color"
        class="hover:bg-b-3 rounded p-1.5"
        type="button"
        @click="handleColorClick(variable.uid)">
        <div
          class="h-2.5 w-2.5 rounded-xl"
          :style="{ backgroundColor: variable.color }"></div>
      </button>
      <ScalarIcon
        v-if="variable.icon"
        class="text-sidebar-c-2 size-3.5 stroke-[2.25]"
        :icon="variable.icon" />
      <span
        class="empty-variable-name text-sm line-clamp-1 break-all group-hover:pr-5">
        {{ variable.name }}
      </span>
      <SidebarListElementActions
        :isCopyable="isCopyable"
        :isDeletable="isDeletable"
        :isRenameable="isRenameable"
        :variable="{ ...variable, isDefault: variable.isDefault ?? false }"
        :warningMessage="warningMessage"
        @delete="handleDelete"
        @rename="handleRename" />
    </router-link>
  </li>
</template>
<style scoped>
.active-link {
  @apply bg-b-2 text-c-1;
}
.empty-variable-name:empty:before {
  content: 'Untitled';
  color: var(--scalar-color-3);
}
</style>
