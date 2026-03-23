<script lang="ts">
export default {
  name: 'PostmanRequestTreeRow',
}
</script>

<script setup lang="ts">
import { ScalarCheckboxInput } from '@scalar/components'
import { ScalarIconCaretRight, ScalarIconWarning } from '@scalar/icons'
import { computed, ref } from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import {
  collectRequestPathKeysUnderFolder,
  folderFullySelected,
  folderHasPartialSelection,
  pathKey,
  type PostmanTreeNode,
} from '@/v2/features/command-palette/helpers/postman-request-tree'

import PostmanRequestTreeRow from './PostmanRequestTreeRow.vue'

const props = defineProps<{
  node: PostmanTreeNode
  /** Drives checked / indeterminate UI; passed down so rows re-render when selection changes. */
  selectedKeys: string[]
  collisionPathKeys: readonly string[]
  mergeSamePathAndMethod: boolean
}>()

const emit = defineEmits<{
  (event: 'requestSelectionChange', key: string, selected: boolean): void
  (
    event: 'folderSelectionChange',
    node: PostmanTreeNode,
    selected: boolean,
  ): void
}>()

const expanded = ref(true)

const selectedSet = computed(() => new Set(props.selectedKeys))

const hasChildren = computed(() =>
  Boolean(
    props.node.isFolder &&
    props.node.children &&
    props.node.children.length > 0,
  ),
)

const folderRequestKeys = computed(() =>
  props.node.isFolder ? collectRequestPathKeysUnderFolder(props.node) : [],
)

/** e.g. "2/7" for folders (selected requests / total requests under folder). */
const folderSelectionFraction = computed(() => {
  const keys = folderRequestKeys.value
  if (keys.length === 0) {
    return null
  }
  let selected = 0
  for (const key of keys) {
    if (selectedSet.value.has(key)) {
      selected++
    }
  }
  return `${selected}/${keys.length}`
})

const rowChecked = computed(() => {
  if (props.node.isFolder) {
    return folderFullySelected(props.node, selectedSet.value)
  }
  return selectedSet.value.has(pathKey(props.node.path))
})

const rowIndeterminate = computed(
  () =>
    props.node.isFolder &&
    folderHasPartialSelection(props.node, selectedSet.value),
)

const onCheckboxUpdate = (checked: boolean | undefined): void => {
  if (props.node.isFolder) {
    emit('folderSelectionChange', props.node, Boolean(checked))
  } else {
    emit('requestSelectionChange', pathKey(props.node.path), Boolean(checked))
  }
}

const toggleExpanded = (): void => {
  expanded.value = !expanded.value
}

const requestPathKey = computed(() => pathKey(props.node.path))

const isCollidingRequest = computed(
  () =>
    !props.node.isFolder &&
    props.collisionPathKeys.includes(requestPathKey.value),
)

const collisionRowTitle = computed(() => {
  if (!isCollidingRequest.value) {
    return undefined
  }
  return props.mergeSamePathAndMethod
    ? 'Same path and HTTP method as another selected request — these merge into one operation when you import.'
    : 'Same path and HTTP method as another selected request — one overwrites the others when you import unless merge is enabled.'
})
</script>

<template>
  <div class="select-none">
    <div
      class="postman-tree-row flex min-h-7 items-center gap-1.5 py-px pr-2"
      :class="{ 'postman-tree-row--collision': isCollidingRequest }"
      :title="collisionRowTitle">
      <button
        v-if="hasChildren"
        :aria-expanded="expanded"
        class="text-c-3 hover:text-c-1 -ml-0.5 flex size-6 shrink-0 items-center justify-center rounded transition-colors"
        type="button"
        @click.stop="toggleExpanded">
        <ScalarIconCaretRight
          class="size-3 transition-transform duration-150 ease-out"
          :class="{ 'rotate-90': expanded }"
          weight="bold" />
        <span class="sr-only">
          {{ expanded ? 'Collapse' : 'Expand' }} folder {{ props.node.name }}
        </span>
      </button>
      <div
        v-else
        aria-hidden="true"
        class="size-6 shrink-0" />

      <!-- ScalarFormInput -->
      <div class="postman-tree-row__checkbox flex flex-1 items-center gap-2">
        <ScalarCheckboxInput
          :indeterminate="rowIndeterminate"
          :modelValue="rowChecked"
          type="checkbox"
          @update:modelValue="onCheckboxUpdate">
          <div class="flex flex-row gap-1">
            <div
              v-if="!props.node.isFolder && props.node.method"
              class="postman-tree-row__method flex w-6 items-center pr-4">
              <HttpMethod
                class="postman-tree-row__http-method text-[10px] leading-none font-semibold"
                :method="props.node.method" />
            </div>
            <span
              class="text-c-1 min-w-0 truncate text-xs leading-snug font-normal"
              :class="{ 'font-medium': hasChildren }"
              :title="props.node.name">
              {{ props.node.name }}
            </span>
          </div>
          <!-- Trailing method (same width as address-bar history) so names stay primary on the left -->
        </ScalarCheckboxInput>

        <span
          v-if="props.node.isFolder && folderSelectionFraction"
          class="text-c-3 shrink-0 text-[10px] font-normal tabular-nums opacity-80">
          {{ folderSelectionFraction }}
        </span>
      </div>

      <span
        v-if="isCollidingRequest"
        :aria-label="
          collisionRowTitle ?? 'Request conflicts with another selection'
        "
        class="postman-tree-row__collision-icon text-c-3 inline-flex size-5 shrink-0 items-center justify-center"
        role="img"
        :title="collisionRowTitle">
        <ScalarIconWarning
          aria-hidden="true"
          class="size-3.5 shrink-0 text-[var(--scalar-color-red)]"
          weight="bold" />
      </span>
    </div>

    <div
      v-if="hasChildren && expanded"
      class="border-l-border/50 ml-[11px] border-l border-dotted pl-2">
      <PostmanRequestTreeRow
        v-for="child in props.node.children"
        :key="pathKey(child.path)"
        :collisionPathKeys="props.collisionPathKeys"
        :mergeSamePathAndMethod="props.mergeSamePathAndMethod"
        :node="child"
        :selectedKeys="props.selectedKeys"
        @folderSelectionChange="
          (node, selected) => emit('folderSelectionChange', node, selected)
        "
        @requestSelectionChange="
          (key, selected) => emit('requestSelectionChange', key, selected)
        " />
    </div>
  </div>
</template>

<style scoped>
/**
 * Checkbox rows use ScalarFormInput as a label with bg-b-1.5, padding, and shadow.
 * Reset so tree lines stay visually flat inside the import modal.
 */
.postman-tree-row__checkbox :deep(label) {
  gap: 0.375rem;
  border-radius: 0;
  padding: 0;
  background-color: transparent !important;
  box-shadow: none !important;
}

.postman-tree-row__checkbox :deep(label:hover),
.postman-tree-row__checkbox :deep(label:focus-within) {
  background-color: transparent !important;
}

.postman-tree-row--collision {
  border-radius: var(--scalar-radius-md, 4px);
  /* Same surface as `.postman-import-path-conflict-callout` — no extra stroke (avoids layout shift and harsh edges in the tree) */
  background-color: var(--scalar-background-danger);
}

/* Display-only HttpMethod defaults to centered pill; keep it a compact trailing label */
.postman-tree-row__http-method :deep(> div) {
  justify-content: flex-end;
  border-radius: 0;
  padding: 0;
  min-height: 0;
  background: none !important;
}
</style>
