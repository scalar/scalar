<script setup lang="ts">
import { HttpMethod } from '@/components/HttpMethod'
import { useLayout, useSidebar } from '@/hooks'
import { getModifiers } from '@/libs'
import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import type { SidebarItem, SidebarMenuItem } from '@/views/Request/types'
import {
  ScalarButton,
  ScalarIcon,
  ScalarSidebarGroupToggle,
  ScalarTooltip,
} from '@scalar/components'
import {
  Draggable,
  type DraggableProps,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/draggable'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { shouldIgnoreEntity } from '@scalar/oas-utils/helpers'
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

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

const { activeCollection, activeRequest, activeRouterParams, activeWorkspace } =
  useActiveEntities()
const {
  collections,
  tags,
  requests,
  requestExamples,
  collectionMutators,
  tagMutators,
  requestMutators,
  requestExampleMutators,
  events,
} = useWorkspace()
const router = useRouter()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()
const { layout } = useLayout()

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
      documentUrl: collection.documentUrl,
      watchMode: collection.watchMode,
      warning:
        'This cannot be undone. You’re about to delete the collection and all folders and requests inside it.',
      edit: (name: string, icon?: string) => {
        collectionMutators.edit(collection.uid, 'info.title', name)
        if (icon) collectionMutators.edit(collection.uid, 'x-scalar-icon', icon)
      },
      delete: () => {
        if (activeWorkspace.value)
          collectionMutators.delete(collection, activeWorkspace.value)
      },
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
      delete: () => {
        if (props.parentUids[0]) tagMutators.delete(tag, props.parentUids[0])
      },
    }

  if (request)
    return {
      title: request.summary ?? request.path,
      link: {
        name: 'request',
        params: {
          workspace: activeWorkspace.value?.uid,
          request: request.uid,
        },
      },
      method: request.method,
      entity: request,
      resourceTitle: 'Request',
      warning: 'This cannot be undone. You’re about to delete the request.',
      children: request.examples.slice(1),
      edit: (name: string) =>
        requestMutators.edit(request.uid, 'summary', name),
      delete: () => {
        if (props.parentUids[0]) {
          requestMutators.delete(request, props.parentUids[0])
        }
      },
    }

  if (requestExample)
    return {
      title: requestExample.name,
      link: {
        name: 'request.examples',
        params: {
          workspace: activeWorkspace.value?.uid,
          request: requestExample.requestUid,
          examples: requestExample.uid,
        },
      },
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

  // Catch all item which we should never see
  return {
    title: 'Unknown',
    entity: {
      uid: '',
      type: 'unknown',
    },
    resourceTitle: 'Unknown',
    children: [],
    edit: () => {},
    delete: () => {},
  } satisfies SidebarItem
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
  else if (layout === 'modal') return `${(props.parentUids.length - 1) * 12}px`
  else return `${props.parentUids.length * 12}px`
})
const paddingOffset = computed(() => {
  if (!props.parentUids.length) return '0px'
  else if (layout === 'modal') return `${(props.parentUids.length - 1) * 12}px`
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
  if (layout === 'modal') return false
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

const watchIconColor = computed(() => {
  const { uid, watchModeStatus } = activeCollection.value || {}

  if (uid !== item.value.entity.uid) return 'text-c-3'
  if (watchModeStatus === 'WATCHING') return 'text-c-1'
  if (watchModeStatus === 'ERROR') return 'text-red'
  return 'text-c-3'
})

const hasDraftRequests = computed(() => {
  return (
    item.value.title == 'Drafts' &&
    layout !== 'modal' &&
    item.value.children.length > 0
  )
})

/**
 * Check if the item should be shown.
 * This is used to hide items that are marked as hidden/internal.
 */
const shouldShowItem = computed(() => {
  const request = requests[props.uid]
  if (request) return !shouldIgnoreEntity(request)

  const tag = tags[props.uid]
  if (tag) return !shouldIgnoreEntity(tag)

  return true
})
</script>

<template>
  <li
    v-if="shouldShowItem"
    class="relative flex flex-row"
    :class="[
      (layout === 'modal' && parentUids.length > 1) ||
      (layout !== 'modal' && parentUids.length)
        ? 'before:bg-border before:pointer-events-none before:z-1 before:absolute before:left-[calc(.75rem_+_.5px)] before:top-0 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] mb-[.5px] last:mb-0 indent-border-line-offset'
        : '',
    ]">
    <Draggable
      :id="item.entity.uid"
      ref="draggableRef"
      :ceiling="getDraggableOffsets.ceiling"
      class="flex flex-1 flex-col gap-1/2 text-sm"
      :floor="getDraggableOffsets.floor"
      :isDraggable="isDraggable"
      :isDroppable="isDroppable"
      :parentIds="parentUids"
      @onDragEnd="(...args) => $emit('onDragEnd', ...args)">
      <!-- Request -->
      <RouterLink
        v-if="item.link"
        v-slot="{ isExactActive }"
        class="group no-underline"
        :to="item.link"
        @click.prevent="
          (event: KeyboardEvent) => handleNavigation(event, item)
        ">
        <div
          class="relative flex min-h-8 cursor-pointer flex-row items-start justify-between gap-0.5 py-1.5 pr-2 rounded w-full"
          :class="[
            highlightClasses,
            isExactActive || isDefaultActive
              ? 'bg-sidebar-active-b text-sidebar-active-c transition-none'
              : 'text-sidebar-c-2',
          ]">
          <span class="break-all line-clamp-1 font-medium w-full pl-2">
            {{ item.title }}
          </span>
          <div class="flex flex-row gap-1 items-center">
            <!-- Menu -->
            <div class="relative">
              <ScalarButton
                v-if="layout !== 'modal'"
                class="hidden px-0.5 py-0 hover:bg-b-3 opacity-0 group-hover:opacity-100 group-hover:flex group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100 aspect-square h-fit"
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
                      targetRef: ev.currentTarget,
                      open: !menuItem.open,
                    })
                ">
                <ScalarIcon
                  icon="Ellipses"
                  size="md" />
              </ScalarButton>
            </div>
            <span class="flex items-start">
              &hairsp;
              <span class="sr-only">HTTP Method:</span>
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
        v-else-if="layout !== 'modal' || parentUids.length"
        :aria-expanded="collapsedSidebarFolders[item.entity.uid]"
        class="hover:bg-b-2 group relative flex w-full flex-row justify-start gap-1.5 rounded p-1.5 focus-visible:z-10"
        :class="[highlightClasses]"
        type="button"
        @click="toggleSidebarFolder(item.entity.uid)">
        <span class="flex h-5 items-center justify-center max-w-[14px]">
          <slot name="leftIcon">
            <ScalarSidebarGroupToggle
              class="text-c-3 shrink-0"
              :open="collapsedSidebarFolders[item.entity.uid]" />
          </slot>
          &hairsp;
        </span>
        <div class="flex flex-1 flex-row justify-between">
          <span class="break-all line-clamp-1 font-medium text-left w-full">
            {{ item.title }}
          </span>
          <div class="relative flex justify-end h-fit">
            <div
              class="items-center opacity-0 gap-px group-hover:opacity-100 group-hover:flex group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
              :class="{
                flex: menuItem.open,
                hidden:
                  !menuItem.open ||
                  menuItem.item?.entity.uid !== item.entity.uid,
              }">
              <ScalarButton
                v-if="
                  (layout !== 'modal' && !isDraftCollection) ||
                  (isDraftCollection && hasDraftRequests)
                "
                class="px-0.5 py-0 hover:bg-b-3 hover:text-c-1 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100 aspect-square h-fit"
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
                  size="md" />
              </ScalarButton>
              <ScalarButton
                v-if="layout !== 'modal'"
                class="px-0.5 py-0 hover:bg-b-3 hover:text-c-1 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100 aspect-square h-fit"
                size="sm"
                variant="ghost"
                @click.stop.prevent="openCommandPaletteRequest()">
                <ScalarIcon
                  icon="Add"
                  size="md"
                  thickness="2" />
              </ScalarButton>
            </div>
            <ScalarTooltip
              v-if="item.watchMode"
              side="right"
              :sideOffset="12">
              <template #trigger>
                <ScalarIcon
                  class="ml-0.5 text-sm"
                  :class="watchIconColor"
                  icon="Watch"
                  size="md"
                  thickness="2" />
              </template>
              <template #content>
                <div
                  class="grid gap-1.5 pointer-events-none max-w-10 w-content shadow-lg rounded bg-b-1 z-100 p-2 text-xxs leading-5 z-10 text-c-1">
                  <div class="flex items-center text-c-2">
                    <p class="text-pretty break-all">
                      Watching: {{ item.documentUrl }}
                    </p>
                  </div>
                </div>
              </template>
            </ScalarTooltip>
            <span>&hairsp;</span>
          </div>
        </div>
      </button>

      <!-- Children -->
      <ul v-if="showChildren">
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
            class="mx-0.5 h-2.5 w-2.5"
            icon="Add"
            thickness="3" />
          <span>Add Request</span>
        </ScalarButton>
      </ul>
    </Draggable>
  </li>
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
.sidebar-folderitem :deep(.ellipsis-position) {
  right: 6px;
  transform: none;
}
</style>
