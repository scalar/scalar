<script setup lang="ts">
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
import type { Collection, Request } from '@scalar/oas-utils/entities/spec'
import { shouldIgnoreEntity } from '@scalar/oas-utils/helpers'
import { computed, nextTick, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { HttpMethod } from '@/components/HttpMethod'
import { useLayout } from '@/hooks/useLayout'
import { useSidebar } from '@/hooks/useSidebar'
import { getModifiers } from '@/libs'
import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import type { SidebarItem, SidebarMenuItem } from '@/views/Request/types'

const {
  isDraggable = false,
  isDroppable = false,
  parentUids,
  uid,
  menuItem,
} = defineProps<{
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
}>()

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
  const collection = collections[uid]
  const tag = tags[uid]
  const request = requests[uid]
  const requestExample = requestExamples[uid]

  if (collection) {
    return {
      title: collection.info?.title || 'Untitled Collection',
      entity: collection,
      resourceTitle: 'Collection',
      children: collection.children,
      icon: collection['x-scalar-icon'],
      documentUrl: collection.documentUrl,
      watchMode: collection.watchMode,
      to:
        collection.uid && collection?.info?.title !== 'Drafts'
          ? {
              name: 'collection',
              params: {
                [PathId.Workspace]: activeWorkspace.value?.uid,
                [PathId.Collection]: collection.uid,
              },
            }
          : undefined,
      warning:
        "This cannot be undone. You're about to delete the collection and all folders and requests inside it.",
      edit: (name: string, icon?: string) => {
        collectionMutators.edit(collection.uid, 'info.title', name)
        if (icon) {
          collectionMutators.edit(collection.uid, 'x-scalar-icon', icon)
        }
      },
      delete: () => {
        if (activeWorkspace.value) {
          collectionMutators.delete(collection, activeWorkspace.value)
        }
      },
    }
  }

  if (tag) {
    return {
      title: tag.name,
      entity: tag,
      resourceTitle: 'Tag',
      children: tag.children,
      warning:
        "This cannot be undone. You're about to delete the tag and all requests inside it",
      edit: (name: string) => tagMutators.edit(tag.uid, 'name', name),
      delete: () =>
        parentUids[0] &&
        tagMutators.delete(tag, parentUids[0] as Collection['uid']),
    }
  }

  if (request) {
    return {
      title: request.summary ?? request.path,
      to: {
        name: 'request',
        params: {
          workspace: activeWorkspace.value?.uid,
          request: request.uid,
        },
      },
      method: request.method,
      entity: request,
      resourceTitle: 'Request',
      warning: "This cannot be undone. You're about to delete the request.",
      children: request.examples.slice(1),
      edit: (name: string) =>
        requestMutators.edit(request.uid, 'summary', name),
      delete: () =>
        parentUids[0] &&
        requestMutators.delete(request, parentUids[0] as Collection['uid']),
    }
  }

  if (requestExample?.requestUid) {
    return {
      title: requestExample.name,
      to: {
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
        "This cannot be undone. You're about to delete the example from the request.",
      children: [],
      edit: (name: string) =>
        requestExampleMutators.edit(requestExample.uid, 'name', name),
      delete: () => requestExampleMutators.delete(requestExample),
    }
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
    edit: () => null,
    delete: () => null,
  } satisfies SidebarItem
})

/** Checks to see if it is a draft collection with the title of Drafts */
const isDraftCollection = computed(
  () =>
    item.value.entity.type === 'collection' && item.value.title === 'Drafts',
)

const highlightClasses = 'hover:bg-sidebar-b-active indent-padding-left'

/** Due to the nesting, we need a dynamic left offset for hover and active backgrounds */
const leftOffset = computed(() => {
  if (!parentUids.length) {
    return '12px'
  }
  if (layout === 'modal') {
    return `${(parentUids.length - 1) * 12}px`
  }
  return `${parentUids.length * 12}px`
})
const paddingOffset = computed(() => {
  if (!parentUids.length) {
    return '0px'
  }
  if (layout === 'modal') {
    return `${(parentUids.length - 1) * 12}px`
  }
  return `${parentUids.length * 12}px`
})

/**
 * Show folders if they are open,
 * show examples if there are more than one and the request is active
 */
const showChildren = computed(
  () =>
    collapsedSidebarFolders[uid] ||
    (activeRequest.value?.uid === uid &&
      (item.value.entity as Request).examples.length > 1),
)

/** Since we have exact routing, we should check if the default request is active */
const isDefaultActive = computed(
  () =>
    typeof router.currentRoute.value.name === 'string' &&
    router.currentRoute.value.name.startsWith('request') &&
    activeRouterParams.value[PathId.Request] === 'default' &&
    activeRequest.value?.uid === uid,
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

  if (!draggableRef.value) {
    return { ceiling, floor }
  }
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
  if (layout === 'modal') {
    return false
  }
  // RequestExamples cannot be dropped on
  if (requestExamples[hoveredItem.id]) {
    return false
  }
  // Collection cannot be dropped into another collection
  if (collections[draggingItem.id]) {
    return false
  }

  return true
}

const handleNavigation = (event: KeyboardEvent, _item: SidebarItem) => {
  if (event) {
    const modifier = getModifiers(['default'])
    const isModifierPressed = modifier.some((key) => event[key])

    if (isModifierPressed) {
      emit('newTab', _item.title || '', _item.entity.uid)
    } else if (_item.to) {
      router.push(_item.to)
    }

    nextTick(() => events.focusAddressBar.emit())
  }
}

function addRequest(entityUid: string) {
  const collectionUid = parentUids[0]
    ? collections[parentUids[0]]?.uid || ''
    : entityUid

  // If the entity is a tag, add the tag name to the request
  const requestData =
    parentUids[0] && tags[entityUid]?.name
      ? { tags: [tags[entityUid].name] }
      : {}

  const newRequest = requestMutators.add(
    requestData,
    collectionUid as Collection['uid'],
  )

  if (newRequest) {
    router.push({
      name: 'request',
      params: {
        workspace: activeWorkspace.value?.uid,
        request: newRequest.uid,
      },
    })

    // Focus the address bar
    events.hotKeys.emit({
      focusAddressBar: new KeyboardEvent('keydown', { key: 'l' }),
    })
  }
}

const watchIconColor = computed(() => {
  const { uid: _uid, watchModeStatus } = activeCollection.value || {}

  if (_uid !== item.value.entity.uid) {
    return 'text-c-3'
  }
  if (watchModeStatus === 'WATCHING') {
    return 'text-c-1'
  }
  if (watchModeStatus === 'ERROR') {
    return 'text-red'
  }
  return 'text-c-3'
})

const hasDraftRequests = computed(() => {
  return (
    item.value.title === 'Drafts' &&
    layout !== 'modal' &&
    item.value.children.length > 0
  )
})

/**
 * Check if the item should be shown.
 * This is used to hide items that are marked as hidden/internal.
 */
const shouldShowItem = computed(() => {
  const request = requests[uid]
  if (request) {
    return !shouldIgnoreEntity(request)
  }

  const tag = tags[uid]
  if (tag) {
    return !shouldIgnoreEntity(tag)
  }

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
        ? 'before:bg-border indent-border-line-offset mb-[.5px] before:pointer-events-none before:absolute before:top-0 before:left-[calc(.75rem_+_.5px)] before:z-1 before:h-[calc(100%_+_.5px)] before:w-[.5px] last:mb-0 last:before:h-full'
        : '',
    ]">
    <Draggable
      :id="item.entity.uid"
      ref="draggableRef"
      :ceiling="getDraggableOffsets.ceiling"
      class="gap-1/2 flex flex-1 flex-col text-base"
      :floor="getDraggableOffsets.floor"
      :isDraggable="isDraggable"
      :isDroppable="isDroppable"
      :parentIds="parentUids"
      @onDragEnd="(...args) => $emit('onDragEnd', ...args)">
      <!-- Request -->
      <RouterLink
        v-if="
          (item.entity.type === 'request' ||
            item.entity.type === 'requestExample') &&
          item.to
        "
        v-slot="{ isExactActive }"
        class="group no-underline"
        :to="item.to"
        @click.prevent="
          (event: KeyboardEvent) => handleNavigation(event, item)
        ">
        <div
          class="relative flex min-h-8 w-full cursor-pointer flex-row items-start justify-between gap-0.5 rounded py-1.5 pr-2"
          :class="[
            highlightClasses,
            isExactActive || isDefaultActive
              ? 'bg-sidebar-b-active text-sidebar-c-active font-medium transition-none'
              : 'text-sidebar-c-2',
          ]">
          <span class="line-clamp-1 w-full pl-2 break-all">
            {{ item.title || 'Untitled' }}
          </span>
          <div class="flex flex-row items-center gap-1">
            <!-- Menu -->
            <div class="relative">
              <ScalarButton
                v-if="layout !== 'modal'"
                class="hover:bg-b-3 hidden aspect-square h-fit px-0.5 py-0 opacity-0 group-hover:flex group-hover:opacity-100 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
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

      <!-- Collection -->
      <RouterLink
        v-else-if="
          (layout !== 'modal' || parentUids.length) &&
          item.entity.type === 'collection' &&
          item.to
        "
        :aria-expanded="Boolean(collapsedSidebarFolders[item.entity.uid])"
        class="hover:bg-b-2 group relative flex w-full flex-row justify-start gap-1.5 rounded p-1.5 no-underline focus-visible:z-10"
        :class="[
          highlightClasses,
          {
            'bg-sidebar-b-active text-sidebar-c-active transition-none':
              typeof router.currentRoute.value.name === 'string' &&
              router.currentRoute.value.name.startsWith('collection') &&
              router.currentRoute.value.params[PathId.Collection] ===
                item.entity.uid,
            'text-c-2': item.title === 'Untitled Collection',
          },
        ]"
        :to="item.to">
        <span
          class="flex h-5 max-w-[14px] cursor-pointer items-center justify-center"
          @click.stop.prevent="toggleSidebarFolder(item.entity.uid)">
          <slot name="leftIcon">
            <ScalarSidebarGroupToggle
              class="text-c-3 shrink-0"
              :open="Boolean(collapsedSidebarFolders[item.entity.uid])" />
          </slot>
          &hairsp;
        </span>
        <div class="flex flex-1 flex-row justify-between font-medium">
          <span class="line-clamp-1 w-full text-left break-all">
            {{ item.title }}
          </span>
          <div class="relative flex h-fit justify-end">
            <div
              class="items-center gap-px opacity-0 group-hover:flex group-hover:opacity-100 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
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
                class="hover:bg-b-3 hover:text-c-1 aspect-square h-fit px-0.5 py-0 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
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
                class="hover:bg-b-3 hover:text-c-1 aspect-square h-fit px-0.5 py-0 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
                size="sm"
                variant="ghost"
                @click.stop.prevent="addRequest(item.entity.uid)">
                <ScalarIcon
                  icon="Add"
                  size="md"
                  thickness="2" />
              </ScalarButton>
            </div>
            <ScalarTooltip
              v-if="item.watchMode"
              placement="right"
              :offset="12"
              :content="`Watching: ${item.documentUrl}`">
              <button
                class="flex items-center justify-center"
                type="button">
                <ScalarIcon
                  class="ml-0.5 text-sm"
                  :class="watchIconColor"
                  icon="Watch"
                  size="md"
                  thickness="2" />
              </button>
            </ScalarTooltip>
            <span>&hairsp;</span>
          </div>
        </div>
      </RouterLink>

      <!-- Tag -->
      <button
        v-else-if="layout !== 'modal' || parentUids.length"
        :aria-expanded="Boolean(collapsedSidebarFolders[item.entity.uid])"
        class="hover:bg-b-2 group relative flex w-full flex-row justify-start gap-1.5 rounded p-1.5 focus-visible:z-10"
        :class="[highlightClasses]"
        type="button"
        @click="toggleSidebarFolder(item.entity.uid)">
        <span class="flex h-5 max-w-[14px] items-center justify-center">
          <slot name="leftIcon">
            <ScalarSidebarGroupToggle
              class="text-c-3 hover:text-c-1 shrink-0"
              :open="Boolean(collapsedSidebarFolders[item.entity.uid])" />
          </slot>
          &hairsp;
        </span>
        <div class="flex flex-1 flex-row justify-between">
          <span class="line-clamp-1 w-full text-left font-medium break-all">
            {{ item.title }}
          </span>
          <div class="relative flex h-fit justify-end">
            <div
              class="items-center gap-px opacity-0 group-hover:flex group-hover:opacity-100 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
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
                class="hover:bg-b-3 hover:text-c-1 aspect-square h-fit px-0.5 py-0 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
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
                class="hover:bg-b-3 hover:text-c-1 aspect-square h-fit px-0.5 py-0 group-focus-visible:opacity-100 group-has-[:focus-visible]:opacity-100"
                size="sm"
                variant="ghost"
                @click.stop.prevent="addRequest(item.entity.uid)">
                <ScalarIcon
                  icon="Add"
                  size="md"
                  thickness="2" />
              </ScalarButton>
            </div>
            <ScalarTooltip
              v-if="item.watchMode"
              content="Watching: {{ item.documentUrl }}"
              placement="right"
              :offset="12">
              <button
                class="flex items-center justify-center"
                type="button">
                <ScalarIcon
                  class="ml-0.5 text-sm"
                  :class="watchIconColor"
                  icon="Watch"
                  size="md"
                  thickness="2" />
              </button>
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
          class="text-c-1 hover:bg-b-2 flex h-8 w-full justify-start gap-1.5 py-0 text-xs"
          :class="parentUids.length ? 'pl-9' : ''"
          variant="ghost"
          @click="addRequest(item.entity.uid)">
          <ScalarIcon
            icon="Add"
            size="sm" />
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
