<script setup lang="ts">
import { HttpMethod } from '@/components/HttpMethod'
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { useSidebar } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import {
  Draggable,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/draggable'
import '@scalar/draggable/style.css'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { RequestRef } from '@scalar/oas-utils/entities/workspace/spec'
import { type DeepReadonly, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    /** For folder mode we need all the folders to check against */
    folders: DeepReadonly<Collection['folders']>
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
    isDroppable?: boolean
    /** Both inidicate the level and provide a way to traverse upwards */
    parentUids: string[]
    item:
      | DeepReadonly<Collection>
      | DeepReadonly<Collection['folders']>[string]
      | RequestRef
  }>(),
  { isDraggable: false, isDroppable: false, isChild: false },
)

defineEmits<{
  onDragEnd: [draggingItem: DraggingItem, hoveredItem: HoveredItem]
}>()

defineSlots<{
  leftIcon(): void
}>()

const { activeRequest, requests } = useWorkspace()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()
const router = useRouter()

const isFolder = computed(() => 'children' in props.item)

const highlightClasses =
  'hover:before:bg-sidebar-active-b before:absolute before:inset-0 before:rounded before-left-offset'

/** Due to the nesting, we need a dynamic left offset for hover and active backgrounds */
const leftOffset = computed(() => {
  if (!props.parentUids.length) return '0px'
  else if (isFolder.value) return `-${props.parentUids.length * 16}px`
  else return `-${(props.parentUids.length - 1) * 16}px`
})

const handleNavigation = (event: MouseEvent, uid: string) => {
  if (event.metaKey) {
    window.open(`/request/${uid}`, '_blank')
  } else {
    router.push(`/request/${uid}`)
  }
}

const handleItemAddVariant = () => {
  console.log('add variant')
}

const handleItemRename = () => {
  console.log('rename')
}

const handleItemDuplicate = () => {
  console.log('duplicate')
}

const handleItemDelete = () => {
  console.log('delete')
}
</script>
<template>
  <div
    class="relative flex flex-row"
    :class="
      parentUids.length &&
      `before:bg-b-3 pl-4 before:absolute before:left-[calc(.75rem_+_.5px)] before:top-0 before:z-10 before:h-full before:w-px`
    ">
    <Draggable
      :id="item.uid"
      :ceiling="isFolder ? 0.8 : 0.5"
      class="flex flex-1 flex-col text-sm"
      :floor="isFolder ? 0.2 : 0.5"
      :isDraggable="parentUids.length > 0 && isDraggable"
      :isDroppable="isDroppable"
      :parentIds="parentUids"
      @onDragEnd="(...args) => $emit('onDragEnd', ...args)">
      <!-- Folder -->
      <template v-if="'children' in item">
        <button
          class="hover:bg-b-2 group relative flex w-full flex-row justify-start gap-1.5 rounded p-1.5"
          :class="highlightClasses"
          type="button"
          @click="toggleSidebarFolder(item.uid)">
          <span class="z-10 mr-[-.5px] flex h-fit items-center justify-center">
            <slot name="leftIcon">
              <div
                :class="{
                  'rotate-90': collapsedSidebarFolders[item.uid],
                }">
                <ScalarIcon
                  class="text-c-3 text-sm"
                  icon="ChevronRight"
                  size="sm" />
              </div>
            </slot>
            &hairsp;
          </span>
          <span class="z-10 font-medium">{{
            'spec' in item ? item.spec.info?.title : item.name
          }}</span>
        </button>
        <div v-show="collapsedSidebarFolders[item.uid]">
          <RequestSidebarItem
            v-for="uid in item.children"
            :key="uid"
            :folders="folders"
            :isDraggable="isDraggable"
            :isDroppable="isDroppable"
            :item="folders[uid] || requests[uid]"
            :parentUids="[...parentUids, item.uid]"
            @onDragEnd="(...args) => $emit('onDragEnd', ...args)" />
        </div>
      </template>

      <!-- Operation -->
      <RouterLink
        v-else
        custom
        :to="`/request/${item.uid}`">
        <div
          class="group relative flex min-h-8 cursor-pointer flex-row items-start justify-between gap-2 py-1.5 pr-2"
          :class="[
            highlightClasses,
            activeRequest?.uid === item.uid
              ? 'before:bg-sidebar-active-b text-sidebar-active-c transition-none'
              : 'text-sidebar-c-2',
            !isDroppable ? `pl-6` : 'pl-4',
          ]"
          @click="($event) => handleNavigation($event, item.uid)">
          <span class="z-10 font-medium">
            {{ item?.summary }}
          </span>
          <span
            class="flex group-hover:hidden group-has-[.group-dropdown]:hidden">
            &hairsp;
            <HttpMethod
              class="font-bold"
              :method="item.method" />
          </span>
          <ScalarDropdown
            class="group-dropdown -right-12 top-20"
            placement="left"
            resize>
            <ScalarButton
              class="hover:bg-b-3 z-10 hidden p-1 transition-colors duration-150 group-hover:flex group-has-[.group-dropdown]:flex"
              size="sm"
              variant="ghost"
              @click.stop>
              <ScalarIcon
                class="text-c-2"
                icon="Ellipses"
                size="xs" />
            </ScalarButton>
            <template #items>
              <ScalarDropdownItem class="flex !gap-2">
                <ScalarIcon
                  class="text-c-2 inline-flex"
                  icon="Add"
                  size="xs" />
                <span>Add Variant</span>
                <ScalarHotkey
                  class="absolute right-2 group-hover:opacity-80"
                  hotkey="1"
                  @hotkeyPressed="handleItemAddVariant" />
              </ScalarDropdownItem>
              <ScalarDropdownItem class="flex !gap-2">
                <ScalarIcon
                  class="text-c-2 inline-flex"
                  icon="Edit"
                  size="xs" />
                <span>Rename</span>
                <ScalarHotkey
                  class="absolute right-2 group-hover:opacity-80"
                  hotkey="2"
                  @hotkeyPressed="handleItemRename" />
              </ScalarDropdownItem>
              <ScalarDropdownItem class="flex !gap-2">
                <ScalarIcon
                  class="text-c-2 inline-flex"
                  icon="Duplicate"
                  size="xs" />
                <span>Duplicate</span>
                <ScalarHotkey
                  class="absolute right-2 group-hover:opacity-80"
                  hotkey="3"
                  @hotkeyPressed="handleItemDuplicate" />
              </ScalarDropdownItem>
              <ScalarDropdownDivider />
              <ScalarDropdownItem class="flex !gap-2">
                <ScalarIcon
                  class="text-c-2 inline-flex"
                  icon="Trash"
                  size="xs" />
                <span>Delete</span>
                <ScalarHotkey
                  class="absolute right-2 group-hover:opacity-80"
                  hotkey="4"
                  @hotkeyPressed="handleItemDelete" />
              </ScalarDropdownItem>
            </template>
          </ScalarDropdown>
        </div>
      </RouterLink>
    </Draggable>
  </div>
</template>

<style scoped>
.before-left-offset:before {
  left: v-bind(leftOffset);
}
</style>
