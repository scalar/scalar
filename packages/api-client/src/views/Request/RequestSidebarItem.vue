<script setup lang="ts">
import { HttpMethod } from '@/components/HttpMethod'
import { useSidebar } from '@/hooks'
import { getModifiers } from '@/libs'
import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import type { SidebarItem, SidebarMenuItem } from '@/views/Request/types'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import {
  Draggable,
  type DraggableProps,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/draggable'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

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
    /** Both indicate the level and provide a way to traverse upwards */
    parentUids: string[]
    /** uid of a Collection, Tag, Request or RequestExample */
    uid: string
    /** To keep track of the menu being open */
    menuItem: SidebarMenuItem
  }>(),
  { isDraggable: false, isDroppable: false, isChild: false },
)

const emit = defineEmits<{
  onDragEnd: [draggingItem: DraggingItem, hoveredItem: HoveredItem]
  newTab: [name: string, uid: string]
  openMenu: [menuItem: SidebarMenuItem]
}>()

defineSlots<{
  leftIcon(): void
}>()

const {
  activeRequest,
  activeRouterParams,
  activeWorkspace,
  collections,
  tags,
  isReadOnly,
  requests,
  requestExamples,
  collectionMutators,
  tagMutators,
  requestMutators,
  requestExampleMutators,
  router,
  events,
} = useWorkspace()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()

/** Normalize properties across different types for easy consumption */
const item = computed<SidebarItem>(() => {
  const collection = collections[props.uid]
  const tag = tags[props.uid]
  const request = requests[props.uid]
  const requestExample = requestExamples[props.uid]

  if (collection)
    return {
      title: collection.info?.title ?? 'Unknown title',
      entity: collection,
      resourceTitle: 'Collection',
      children: collection.children,
      icon: collection['x-scalar-icon'],
      warning:
        'This cannot be undone. You’re about to delete the collection and all folders and requests inside it.',
      edit: (name: string, icon?: string) => {
        collectionMutators.edit(collection.uid, 'info.title', name)
        if (icon) collectionMutators.edit(collection.uid, 'x-scalar-icon', icon)
      },
      delete: () =>
        collectionMutators.delete(collection, activeWorkspace.value),
    }

  if (tag)
    return {
      title: tag.name,
      entity: tag,
      resourceTitle: 'Tag',
      children: tag.children,
      warning:
        'This cannot be undone. You’re about to delete the tag and all requests inside it',
      edit: (name: string) => tagMutators.edit(tag.uid, 'name', name),
      delete: () => tagMutators.delete(tag, props.parentUids[0]),
    }

  if (request)
    return {
      title: request.summary ?? [request.method, request.path].join(' - '),
      link: `/workspace/${activeWorkspace.value.uid}/request/${request.uid}`,
      method: request.method,
      entity: request,
      resourceTitle: 'Request',
      warning: 'This cannot be undone. You’re about to delete the request.',
      children: request.examples,
      edit: (name: string) =>
        requestMutators.edit(request.uid, 'summary', name),
      delete: () => requestMutators.delete(request, props.parentUids[0]),
    }

  return {
    title: requestExample.name,
    link: `/workspace/${activeWorkspace.value.uid}/request/${requestExample.requestUid}/examples/${requestExample.uid}`,
    method: requests[requestExample.requestUid]?.method,
    entity: requestExample,
    resourceTitle: 'Example',
    warning:
      'This cannot be undone. You’re about to delete the example from the request.',
    children: [],
    edit: (name: string) =>
      requestExampleMutators.edit(requestExample.uid, 'name', name),
    delete: () => requestExampleMutators.delete(requestExample),
  }
})

/** Checks to see if it is a draft collection with the title of Drafts */
const isDraftCollection = computed(
  () =>
    item.value.entity.type === 'collection' && item.value.title === 'Drafts',
)

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

/**
 * Show folders if they are open,
 * show examples if there are more than one and the request is active
 */
const showChildren = computed(
  () =>
    collapsedSidebarFolders[props.uid] ||
    (activeRequest.value?.uid === props.uid &&
      (item.value.entity as Request).examples.length > 1),
)

/** Since we have exact routing, we should check if the default request is active */
const isDefaultActive = computed(
  () =>
    activeRouterParams.value[PathId.Request] === 'default' &&
    activeRequest.value?.uid === props.uid,
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
  if (
    !collections[draggingItem?.id] &&
    item.value.entity.type === 'collection'
  ) {
    ceiling = 1
    floor = 0
  }
  // Has children but is not a request or a collection
  else if (item.value.entity.type === 'tag') {
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

const handleNavigation = (event: KeyboardEvent, _item: SidebarItem) => {
  if (event) {
    const modifier = getModifiers(['default'])
    const isModifierPressed = modifier.some((key) => event[key])

    if (isModifierPressed) emit('newTab', _item.title || '', _item.entity.uid)
    else if (_item.link) router.push(_item.link)
  }
}

function openCommandPaletteRequest() {
  events.commandPalette.emit({
    commandName: 'Create Request',
    metaData: {
      itemUid: props.uid,
      parentUid: props.parentUids[0],
    },
  })
}
</script>

<template>
  <div
    class="relative flex flex-row"
    :class="[
      (isReadOnly && parentUids.length > 1) ||
      (!isReadOnly && parentUids.length)
        ? 'before:bg-b-3 before:absolute before:left-[calc(.75rem_+_.5px)] before:top-0 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] mb-[.5px] last:mb-0 indent-border-line-offset'
        : '',
    ]">
    <Draggable
      :id="item.entity.uid"
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
        v-if="item.link"
        v-slot="{ isExactActive }"
        class="no-underline"
        :to="item.link"
        @click.prevent="
          (event: KeyboardEvent) => handleNavigation(event, item)
        ">
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
            class="line-clamp-3 font-medium w-full pl-2 word-break-break-word"
            :class="{
              'editable-sidebar-hover-item': !isReadOnly,
            }">
            {{ item.title }}
          </span>
          <div class="flex flex-row gap-1 items-center">
            <!-- Menu -->
            <div class="relative">
              <ScalarButton
                v-if="!isReadOnly"
                class="px-0.5 py-0 hover:bg-b-3 hidden group-hover:flex absolute -translate-y-1/2 right-0 aspect-square inset-y-2/4 h-fit"
                :class="{
                  flex:
                    menuItem?.item?.entity.uid === item.entity.uid &&
                    menuItem.open,
                }"
                size="sm"
                type="button"
                variant="ghost"
                @click.stop.prevent="
                  (ev) =>
                    $emit('openMenu', {
                      item,
                      parentUids,
                      targetRef: ev.currentTarget.parentNode,
                      open: true,
                    })
                ">
                <ScalarIcon
                  icon="Ellipses"
                  size="sm" />
              </ScalarButton>
            </div>
            <span class="flex items-start">
              &hairsp;
              <HttpMethod
                v-if="item.method"
                class="font-bold"
                :method="item.method" />
            </span>
          </div>
        </div>
      </RouterLink>

      <!-- Collection/Folder -->
      <button
        v-else-if="!isReadOnly || parentUids.length"
        class="hover:bg-b-2 group relative flex w-full flex-row justify-start gap-1.5 rounded p-1.5"
        :class="highlightClasses"
        type="button"
        @click="toggleSidebarFolder(item.entity.uid)">
        <span class="flex h-5 items-center justify-center max-w-[14px]">
          <slot name="leftIcon">
            <div
              :class="{
                'rotate-90': collapsedSidebarFolders[item.entity.uid],
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
            class="line-clamp-3 font-medium text-left w-full word-break-break-word"
            :class="{
              'editable-sidebar-hover-item': !isReadOnly,
            }">
            {{ item.title }}
          </span>
          <div class="relative flex h-fit">
            <ScalarButton
              v-if="!isReadOnly && !isDraftCollection"
              class="px-0.5 py-0 hover:bg-b-3 hidden group-hover:flex absolute -translate-y-1/2 right-0 aspect-square inset-y-2/4 h-fit"
              :class="{
                flex:
                  menuItem.item?.entity.uid === item.entity.uid &&
                  menuItem.open,
              }"
              size="sm"
              variant="ghost"
              @click.stop.prevent="
                (ev) =>
                  $emit('openMenu', {
                    item,
                    parentUids,
                    targetRef: ev.currentTarget.parentNode,
                    open: true,
                  })
              ">
              <ScalarIcon
                icon="Ellipses"
                size="sm" />
            </ScalarButton>
            <span>&hairsp;</span>
          </div>
        </div>
      </button>

      <!-- Children -->
      <div v-if="showChildren">
        <!-- We never want to show the first example -->
        <RequestSidebarItem
          v-for="childUid in item.children"
          :key="childUid"
          :isDraggable="!requestExamples[childUid]"
          :isDroppable="_isDroppable"
          :menuItem="menuItem"
          :parentUids="[...parentUids, uid]"
          :uid="childUid"
          @newTab="(name, uid) => $emit('newTab', name, uid)"
          @onDragEnd="(...args) => $emit('onDragEnd', ...args)"
          @openMenu="(item) => $emit('openMenu', item)" />
        <ScalarButton
          v-if="item.children.length === 0"
          class="mb-[.5px] flex gap-1.5 h-8 text-c-1 py-0 justify-start text-xs w-full hover:bg-b-2"
          :class="parentUids.length ? 'pl-9' : ''"
          variant="ghost"
          @click="openCommandPaletteRequest()">
          <ScalarIcon
            class="ml-0.5 h-2.5 w-2.5"
            icon="Add"
            thickness="3" />
          <span>Add Request</span>
        </ScalarButton>
      </div>
    </Draggable>
  </div>
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
