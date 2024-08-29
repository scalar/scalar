<script setup lang="ts">
import { HttpMethod } from '@/components/HttpMethod'
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { useSidebar } from '@/hooks'
import { getModifiers } from '@/libs'
import { PathId } from '@/router'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarContextMenu,
  ScalarIcon,
  ScalarModal,
  ScalarTextField,
  useModal,
} from '@scalar/components'
import {
  Draggable,
  type DraggableProps,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/draggable'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { Folder } from '@scalar/oas-utils/entities/workspace/folder'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import RequestSidebarItemMenu from './RequestSidebarItemMenu.vue'

const props = withDefaults(
  defineProps<{
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
    /** Both inidicate the level and provide a way to traverse upwards */
    parentUids: string[]
    item: Collection | Folder | Request | RequestExample
  }>(),
  { isDraggable: false, isDroppable: false, isChild: false },
)

const emit = defineEmits<{
  onDragEnd: [draggingItem: DraggingItem, hoveredItem: HoveredItem]
  newTab: [name: string, uid: string]
}>()

defineSlots<{
  leftIcon(): void
}>()

const {
  activeRequest,
  activeRouterParams,
  activeWorkspace,
  collections,
  folders,
  isReadOnly,
  requests,
  requestExamples,
  collectionMutators,
  folderMutators,
  requestMutators,
  requestExampleMutators,
  router,
} = useWorkspace()
const { replace } = useRouter()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()

const hasChildren = computed(() => 'childUids' in props.item)
const isCollection = computed(() => 'spec' in props.item)
const isRequest = computed(() => 'summary' in props.item)

const highlightClasses = 'hover:bg-sidebar-active-b indent-padding-left'

/** Due to the nesting, we need a dynamic left offset for hover and active backgrounds */
const leftOffset = computed(() => {
  if (!props.parentUids.length) return '12px'
  else if (isReadOnly.value) return `${(props.parentUids.length - 1) * 12}px`
  else return `${props.parentUids.length * 12}px`
})
const paddingOffset = computed(() => {
  if (!props.parentUids.length) return '0px'
  else if (isReadOnly.value) return `${(props.parentUids.length - 1) * 12}px`
  else return `${props.parentUids.length * 12}px`
})

const getTitle = (item: (typeof props)['item']) => {
  // Collection
  if ('spec' in item) return item.spec.info?.title
  // Request
  else if ('summary' in item) return item.summary || item.path
  // Folder/Example
  else if ('name' in item) return item.name

  return ''
}

/**
 * We either show the method or the parent request method
 */
const method = computed(() => {
  const _request = (
    'requestUid' in props.item ? requests[props.item.requestUid] : props.item
  ) as Request
  return _request.method
})

/**
 * Show folders if they are open,
 * show examples if there are more than one and the request is active
 */
const showChildren = computed(
  () =>
    collapsedSidebarFolders[props.item.uid] ||
    (activeRequest.value?.uid === props.item.uid &&
      (props.item as Request).childUids.length > 1),
)

/** Generate the request OR example link */
const generateLink = () =>
  'requestUid' in props.item
    ? `/workspace/${activeWorkspace.value.uid}/request/${props.item.requestUid}/examples/${props.item.uid}`
    : `/workspace/${activeWorkspace.value.uid}/request/${props.item.uid}`

/** Since we have exact routing, we should check if the default request is active */
const isDefaultActive = computed(
  () =>
    activeRouterParams.value[PathId.Request] === 'default' &&
    activeRequest.value.uid === props.item.uid,
)

/** The draggable component */
const draggableRef = ref<{
  draggingItem: DraggingItem
  hoveredItem: HoveredItem
} | null>(null)

/** Calculate offsets which change a little depending on whats being dragged and hovered over */
const getDraggableOffsets = computed(() => {
  let ceiling = 0.5
  let floor = 0.5

  if (!draggableRef.value) return { ceiling, floor }
  const { draggingItem } = draggableRef.value

  // If hovered over is collection && dragging is not a collection
  if (!collections[draggingItem?.id] && isCollection.value) {
    ceiling = 1
    floor = 0
  }
  // Has children but is not a request or a collection
  else if (hasChildren.value && !isRequest.value && !isCollection.value) {
    ceiling = 0.8
    floor = 0.2
  }

  return { ceiling, floor }
})

/** Guard to check if an element is able to be dropped on */
const _isDroppable = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
  // Cannot drop in read only mode
  if (activeWorkspace.value.isReadOnly) return false
  // RequestExamples cannot be dropped on
  if (requestExamples[hoveredItem.id]) return false
  // Collection cannot be dropped into another collection
  if (collections[draggingItem.id]) return false

  return true
}

const tempName = ref('')
const renameModal = useModal()
const deleteModal = useModal()

const handleItemRename = () => {
  // Request
  if ('summary' in props.item) {
    requestMutators.edit(props.item.uid, 'summary', tempName.value)
  }
  // Example
  else if ('requestUid' in props.item) {
    requestExampleMutators.edit(props.item.uid, 'name', tempName.value)
  }
  // Collection
  else if ('spec' in props.item) {
    collectionMutators.edit(props.item.uid, 'spec.info.title', tempName.value)
  }
  // Folder
  else {
    folderMutators.edit(props.item.uid, 'name', tempName.value)
  }

  renameModal.hide()
}

const openRenameModal = () => {
  tempName.value = getTitle(props.item) || ''
  renameModal.show()
}

/** Delete handles both requests and requestExamples */
const handleItemDelete = () => {
  // Delete example
  if ('requestUid' in props.item) {
    requestExampleMutators.delete(props.item)
    if (activeRouterParams.value[PathId.Examples] === props.item.uid) {
      replace(`/workspace/${activeWorkspace.value}/request/default`)
    }
  }
  // Delete request
  else if ('summary' in props.item) {
    requestMutators.delete(
      props.item,
      props.parentUids[props.parentUids.length - 1],
    )
    if (activeRouterParams.value[PathId.Request] === props.item.uid) {
      replace(`/workspace/${activeWorkspace.value.uid}/request/default`)
    }
  }
  // Delete Collection
  else if ('spec' in props.item) {
    collectionMutators.delete(props.item)
  }
  // Delete folder
  else if ('name' in props.item) {
    folderMutators.delete(
      props.item,
      props.parentUids[props.parentUids.length - 1],
    )
  }
}

const itemName = computed(() => {
  if ('summary' in props.item) return props.item.summary || ''
  if ('name' in props.item) return props.item.name || ''
  if ('spec' in props.item) return props.item.spec.info?.title || ''
  return ''
})

/** Gets the title of the resource to use in the modal titles */
const resourceTitle = computed(() => {
  if ('requestUid' in props.item) return 'Example'
  if ('summary' in props.item) return 'Request'
  if ('spec' in props.item) return 'Collection'
  return 'Folder'
})

const handleNavigation = (event: KeyboardEvent, item: typeof props.item) => {
  if (event) {
    const modifier = getModifiers(['default'])
    const isModifierPressed = modifier.some((key) => event[key])
    if (isModifierPressed) {
      emit('newTab', getTitle(item) || '', item.uid)
    } else {
      router.push(generateLink())
    }
  }
}
</script>
<template>
  <div
    class="relative flex flex-row"
    :class="[
      (isReadOnly && parentUids.length > 1) ||
      (!isReadOnly && parentUids.length)
        ? 'before:bg-b-3 before:absolute before:left-[calc(.75rem_+_.5px)] before:top-0 before:z-10 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] mb-[.5px] last:mb-0 indent-border-line-offset'
        : '',
    ]">
    <Draggable
      :id="item.uid"
      ref="draggableRef"
      :ceiling="getDraggableOffsets.ceiling"
      class="flex flex-1 flex-col gap-[.5px] text-sm"
      :floor="getDraggableOffsets.floor"
      :isDraggable="isDraggable"
      :isDroppable="isDroppable"
      :parentIds="parentUids"
      @onDragEnd="(...args) => $emit('onDragEnd', ...args)">
      <!-- Request -->
      <RouterLink
        v-if="'summary' in item || 'requestUid' in item"
        v-slot="{ isExactActive }"
        class="no-underline"
        :to="generateLink()"
        @click.prevent="
          (event: KeyboardEvent) => handleNavigation(event, item)
        ">
        <ScalarContextMenu :disabled="isReadOnly">
          <template #trigger>
            <div
              class="group relative flex min-h-8 cursor-pointer flex-row items-start justify-between gap-2 py-1.5 pr-2 rounded editable-sidebar-hover w-full"
              :class="[
                highlightClasses,
                isExactActive || isDefaultActive
                  ? 'bg-sidebar-active-b text-sidebar-active-c transition-none'
                  : 'text-sidebar-c-2',
              ]"
              tabindex="0">
              <span
                class="z-10 font-medium w-full pl-2 word-break-break-word"
                :class="{
                  'editable-sidebar-hover-item': !isReadOnly,
                }">
                {{ getTitle(item) }}
              </span>
              <div class="flex flex-row gap-1 items-center">
                <div class="relative">
                  <RequestSidebarItemMenu
                    v-if="!isReadOnly"
                    :item="item"
                    :parentUids="parentUids"
                    :resourceTitle="resourceTitle"
                    @delete="deleteModal.show()"
                    @rename="openRenameModal" />
                </div>
                <span class="flex items-start">
                  &hairsp;
                  <HttpMethod
                    class="font-bold"
                    :method="method" />
                </span>
              </div>
            </div>
          </template>
          <template #content>
            <RequestSidebarItemMenu
              :item="item"
              :parentUids="parentUids"
              :resourceTitle="resourceTitle"
              static
              @delete="deleteModal.show()"
              @rename="openRenameModal" />
          </template>
        </ScalarContextMenu>
      </RouterLink>

      <!-- Collection/Folder -->
      <ScalarContextMenu
        v-else-if="!isReadOnly || parentUids.length"
        :disabled="
          isReadOnly || (item as Collection).spec?.info?.title === 'Drafts'
        ">
        >
        <template #trigger>
          <button
            class="hover:bg-b-2 group relative flex w-full flex-row justify-start gap-1.5 rounded p-1.5 z-[1]"
            :class="highlightClasses"
            type="button"
            @click="toggleSidebarFolder(item.uid)">
            <span
              class="z-10 flex h-5 items-center justify-center max-w-[14px]">
              <slot name="leftIcon">
                <div
                  :class="{
                    'rotate-90': collapsedSidebarFolders[item.uid],
                  }">
                  <ScalarIcon
                    class="text-c-3 text-sm"
                    icon="ChevronRight"
                    size="sm"
                    thickness="2.5" />
                </div>
              </slot>
              &hairsp;
            </span>
            <div
              class="flex flex-1 flex-row justify-between editable-sidebar-hover">
              <span
                class="z-10 font-medium text-left w-full word-break-break-word"
                :class="{
                  'editable-sidebar-hover-item': !isReadOnly,
                }">
                {{ getTitle(item) }}
              </span>
              <div class="relative flex h-fit">
                <RequestSidebarItemMenu
                  v-if="
                    !isReadOnly &&
                    (item as Collection).spec?.info?.title !== 'Drafts'
                  "
                  :item="item"
                  :parentUids="parentUids"
                  :resourceTitle="resourceTitle"
                  @delete="deleteModal.show()"
                  @rename="openRenameModal" />
                <span>&hairsp;</span>
              </div>
            </div>
          </button>
        </template>
        <template #content>
          <RequestSidebarItemMenu
            v-if="
              !isReadOnly && (item as Collection).spec?.info?.title !== 'Drafts'
            "
            :item="item"
            :parentUids="parentUids"
            :resourceTitle="resourceTitle"
            static
            @delete="deleteModal.show()"
            @rename="openRenameModal" />
        </template>
      </ScalarContextMenu>

      <!-- Children -->
      <div
        v-if="'childUids' in item"
        v-show="showChildren">
        <!-- We never want to show the first example -->
        <RequestSidebarItem
          v-for="uid in isRequest ? item.childUids.slice(1) : item.childUids"
          :key="uid"
          :isDraggable="!requestExamples[uid]"
          :isDroppable="_isDroppable"
          :item="folders[uid] || requests[uid] || requestExamples[uid]"
          :parentUids="[...parentUids, item.uid]"
          @newTab="(name, uid) => $emit('newTab', name, uid)"
          @onDragEnd="(...args) => $emit('onDragEnd', ...args)" />
      </div>
    </Draggable>
  </div>
  <ScalarModal
    :size="'sm'"
    :state="deleteModal"
    :title="`Delete ${resourceTitle}`">
    <DeleteSidebarListElement
      :variableName="itemName"
      warningMessage="Warning: Deleting this will delete all items inside of this"
      @close="deleteModal.hide()"
      @delete="handleItemDelete" />
  </ScalarModal>
  <ScalarModal
    :state="renameModal"
    :title="`Rename ${resourceTitle}`">
    <ScalarTextField
      v-model="tempName"
      :label="resourceTitle"
      @keydown.prevent.enter="handleItemRename" />
    <div class="flex gap-3">
      <ScalarButton
        class="flex-1"
        variant="outlined"
        @click="renameModal.hide()">
        Cancel
      </ScalarButton>
      <ScalarButton
        class="flex-1"
        type="submit"
        @click="handleItemRename">
        Save
      </ScalarButton>
    </div>
  </ScalarModal>
</template>

<style>
@import '@scalar/draggable/style.css';
</style>
<style scoped>
.indent-border-line-offset:before {
  left: v-bind(leftOffset);
}
.indent-padding-left {
  padding-left: calc(v-bind(paddingOffset) + 6px);
}
.editable-sidebar-hover:hover .editable-sidebar-hover-item {
  mask-image: linear-gradient(
    to left,
    transparent 10px,
    var(--scalar-background-2) 30px
  );
}
.sidebar-folderitem :deep(.ellipsis-position) {
  right: 6px;
  transform: none;
}
.word-break-break-word {
  word-break: break-word;
}
</style>
