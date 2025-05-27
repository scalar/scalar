<script setup lang="ts">
import { ScalarIcon, type Icon } from '@scalar/components'
import {
  Draggable,
  type DraggableProps,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/draggable'
import { computed, ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'

import SidebarListElementActions from '@/components/Sidebar/SidebarListElementActions.vue'

const {
  isDraggable = false,
  isDroppable = false,
  to,
} = defineProps<{
  variable: {
    uid: string
    name: string
    color?: string
    icon?: Icon
    isDefault?: boolean
  }
  warningMessage?: string
  to: RouteLocationRaw
  isDeletable?: boolean
  isCopyable?: boolean
  isRenameable?: boolean
  /**
   * Toggle dragging on and off
   *
   * @default false
   */
  isDraggable?: boolean
  /**
   * Prevents items from being hovered and dropped into
   *
   * @default false
   */
  isDroppable?: DraggableProps['isDroppable']
  collectionId?: string
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'colorModal', id: string): void
  (e: 'rename', id: string): void
  (e: 'onDragEnd', draggingItem: DraggingItem, hoveredItem: HoveredItem): void
}>()

const router = useRouter()

const handleNavigation = (event: MouseEvent) => {
  if (event.metaKey) {
    window.open(router.resolve(to).href, '_blank')
  } else {
    router.push(to)
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

/** The draggable component */
const draggableRef = ref<{
  draggingItem: DraggingItem
  hoveredItem: HoveredItem
} | null>(null)

/** Calculate offsets for drag and drop */
const getDraggableOffsets = computed(() => ({
  ceiling: 0.5,
  floor: 0.5,
}))
</script>

<template>
  <li>
    <Draggable
      :id="variable.uid"
      ref="draggableRef"
      :ceiling="getDraggableOffsets.ceiling"
      :floor="getDraggableOffsets.floor"
      :isDraggable="isDraggable"
      :isDroppable="isDroppable"
      :parentIds="collectionId ? [collectionId] : []"
      @onDragEnd="(...args) => $emit('onDragEnd', ...args)">
      <router-link
        class="text-c-2 hover:bg-b-2 group relative flex h-8 items-center gap-1.5 rounded py-1 pr-1.5 font-medium no-underline"
        :class="[variable.color ? 'pl-5' : 'pl-1.5']"
        exactActiveClass="bg-b-2 !text-c-1"
        role="button"
        :to="to"
        @click.prevent="handleNavigation($event)">
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
          class="empty-variable-name line-clamp-1 text-sm break-all group-hover:pr-5">
          {{ variable.name }}
        </span>
        <SidebarListElementActions
          :isCopyable="Boolean(isCopyable)"
          :isDeletable="Boolean(isDeletable)"
          :isRenameable="Boolean(isRenameable)"
          :variable="{ ...variable, isDefault: variable.isDefault ?? false }"
          :warningMessage="warningMessage"
          @delete="handleDelete"
          @rename="handleRename" />
      </router-link>
    </Draggable>
  </li>
</template>

<style>
@import '@scalar/draggable/style.css';
</style>

<style scoped>
.empty-variable-name:empty:before {
  content: 'Untitled';
  color: var(--scalar-color-3);
}
</style>
