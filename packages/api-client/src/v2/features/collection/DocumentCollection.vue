<script lang="ts">
/**
 * Document Collection Page
 *
 * Displays primary document editing and viewing interface, enabling users to:
 *   - Choose a document icon
 *   - Edit the document title
 *   - Navigate among Overview, Servers, Authentication, Environment, Cookies, and Settings tabs
 */
export default {
  name: 'DocumentCollection',
}
</script>

<script setup lang="ts">
import { ScalarButton, ScalarModal, useModal } from '@scalar/components'
import { ScalarIconFloppyDisk } from '@scalar/icons'
import { LibraryIcon } from '@scalar/icons/library'
import { apply, type Difference, type merge } from '@scalar/json-magic/diff'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { computed, ref } from 'vue'
import { RouterView } from 'vue-router'

import IconSelector from '@/components/IconSelector.vue'
import Callout from '@/v2/components/callout/Callout.vue'
import type { RouteProps } from '@/v2/features/app/helpers/routes'

import LabelInput from './components/LabelInput.vue'
import SyncConflictResolutionEditor from './components/SyncConflictResolutionEditor.vue'
import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

/** Snag the title from the info object */
const title = computed(() => props.document?.info?.title || 'Untitled Document')

/** Default to the folder icon */
const icon = computed(
  () => props.document?.['x-scalar-icon'] || 'interface-content-folder',
)

const syncModal = useModal()

const undoChanges = () => {
  props.workspaceStore.revertDocumentChanges(props.documentSlug)
}

const saveChanges = () => {
  props.workspaceStore.saveDocument(props.documentSlug)
}

// const originalDocument = computed(() =>
//   props.workspaceStore.getOriginalDocument(props.documentSlug),
// )

// const resolvedDocument = ref<Record<string, unknown> | null>(null)

const rebaseResult = ref<{
  originalDocument: Record<string, unknown>
  resolvedDocument: Record<string, unknown>
  conflicts: ReturnType<typeof merge>['conflicts']
  applyChanges: (resolvedConflicts: Difference<unknown>[]) => Promise<void>
} | null>(null)

const handleSyncFlow = async () => {
  const result = await props.workspaceStore.rebaseDocument({
    name: props.documentSlug,
    url: props.document?.['x-scalar-original-source-url'] ?? '',
  })

  console.log('result', result)
  if (result?.ok) {
    const originalDocument =
      props.workspaceStore.getOriginalDocument(props.documentSlug) ?? {}
    rebaseResult.value = {
      conflicts: result.conflicts,
      applyChanges: result.applyChanges,
      resolvedDocument: apply(deepClone(originalDocument), result.changes),
      originalDocument,
    }

    console.log('rebaseResult', rebaseResult.value)

    if (rebaseResult.value.conflicts.length > 0) {
      console.log('showing modal')
      syncModal.show()
    } else {
      console.log('no conflicts')
    }
  } else {
    console.log('no result')
  }
}

// const baseDocument = {
//   info: {
//     title: title.value,
//   },
//   paths: {
//     '/': {
//       get: {
//         summary: 'Get the root path',
//         operationId: 'getRoot',
//       },
//     },
//     '/users': {
//       get: {
//         summary: 'Get the users path',
//         operationId: 'getUsers',
//       },
//     },
//     '/users/{userId}': {
//       get: {
//         summary: 'Get the user by ID',
//         operationId: 'getUserById',
//       },
//     },
//     '/users/{userId}/posts': {
//       get: {
//         summary: 'Get the posts for a user',
//         operationId: 'getPostsForUser',
//       },
//     },
//     '/users/{userId}/posts/{postId}': {
//       get: {
//         summary: 'Get the post by ID',
//         operationId: 'getPostById',
//       },
//     },
//   },
//   components: {},
//   securitySchemes: {},
//   servers: [],
//   tags: [],
//   externalDocs: {},
// }

// const remoteBase = {
//   info: {
//     title: title.value,
//   },
//   paths: {
//     '/': {},
//     '/users': {
//       get: {
//         summary: 'Get the users path',
//         operationId: 'getUsers',
//       },
//     },
//     '/users/{userId}': {
//       get: {
//         summary: 'Get the user by ID',
//         operationId: 'getUserById',
//       },
//     },
//     '/users/{userId}/posts': {
//       get: {
//         summary: 'Get the posts for a user',
//         operationId: 'getPostsForUser',
//       },
//     },
//     '/users/{userId}/posts/{postId}': {
//       post: {
//         summary: 'Create a new post',
//         operationId: 'createPost',
//       },
//     },
//   },
//   components: {},
//   securitySchemes: {},
//   servers: [],
//   tags: [],
//   externalDocs: {},
// }

// const locanIntermediate = {
//   info: {
//     title: title.value,
//   },
//   paths: {
//     '/': {
//       get: {
//         summary: 'I am changed on this and there will be a conflict',
//         operationId: 'getRoot',
//       },
//     },
//     '/users': {
//       get: {
//         summary: 'Get the users path',
//         operationId: 'getUsers',
//       },
//     },
//     '/users/{userId}': {
//       get: {
//         summary: 'Get the user by ID',
//         operationId: 'getUserById',
//       },
//     },
//     '/users/{userId}/posts': {
//       get: {
//         summary: 'Get the posts for a user',
//         operationId: 'getPostsForUser',
//       },
//     },
//     '/users/{userId}/posts/{postId}': {
//       get: {
//         summary: 'I am also a new conflict',
//         operationId: 'getPostById',
//       },
//     },
//   },
//   components: {},
//   securitySchemes: {},
//   servers: [],
//   tags: [],
//   externalDocs: {},
// }

// const changelogAA = diff(baseDocument, locanIntermediate)
// const changelogAB = diff(baseDocument, remoteBase)

// const changesA = merge(changelogAA, changelogAB)

// console.log({ changelogAA, changelogAB, changesA })

// const resolvedDocument = apply(
//   JSON.parse(JSON.stringify(baseDocument)),
//   changesA.diffs,
// )
</script>

<template>
  <div class="custom-scroll h-full">
    <div
      v-if="document"
      class="w-full md:mx-auto md:max-w-180">
      <!-- Header -->
      <div
        :aria-label="`title: ${title}`"
        class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:max-w-180">
        <Callout
          v-if="document?.['x-scalar-is-dirty']"
          class="mb-5"
          type="warning">
          <p>
            You have unsaved changes. Save your work to keep your changes, or
            undo to revert them.
          </p>
          <template #actions>
            <ScalarButton
              class="text-c-2 hover:text-c-1 flex items-center gap-2"
              size="xs"
              type="button"
              variant="outlined"
              @click="undoChanges">
              <span>Undo</span>
            </ScalarButton>
            <ScalarButton
              class="text-c-btn flex items-center gap-2"
              size="xs"
              type="button"
              variant="solid"
              @click="saveChanges">
              <ScalarIconFloppyDisk
                size="sm"
                thickness="1.5" />
              <span>Save</span>
            </ScalarButton>
          </template>
        </Callout>
        <div class="flex flex-row items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <IconSelector
              :modelValue="icon"
              placement="bottom-start"
              @update:modelValue="
                (icon) => eventBus.emit('document:update:icon', icon)
              ">
              <ScalarButton
                class="hover:bg-b-2 aspect-square h-7 w-7 cursor-pointer rounded border border-transparent p-0 hover:border-inherit"
                variant="ghost">
                <LibraryIcon
                  class="text-c-2 size-5"
                  :src="icon"
                  stroke-width="2" />
              </ScalarButton>
            </IconSelector>

            <div class="group relative ml-1.25 min-w-0">
              <LabelInput
                class="text-xl font-bold"
                inputId="documentName"
                :modelValue="title"
                @update:modelValue="
                  (title) => eventBus.emit('document:update:info', { title })
                " />
            </div>
          </div>

          <ScalarButton
            data-testid="document-sync-button"
            size="xs"
            type="button"
            variant="outlined"
            @click="handleSyncFlow">
            Sync
          </ScalarButton>
        </div>
      </div>

      <!-- Tabs -->
      <Tabs type="document" />

      <!-- Router views -->
      <div class="px-1.5 py-8">
        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            v-bind="props"
            collectionType="document" />
        </RouterView>
      </div>
    </div>

    <!-- Document not found -->
    <div
      v-else
      class="flex w-full flex-1 items-center justify-center">
      <div class="flex h-full flex-col items-center justify-center">
        <h1 class="text-2xl font-bold">Document not found</h1>
        <p class="text-gray-500">
          The document you are looking for does not exist.
        </p>
      </div>
    </div>
  </div>
  <ScalarModal
    v-if="rebaseResult"
    bodyClass="sync-conflict-modal-root flex h-dvh flex-col p-4"
    maxWidth="calc(100dvw - 32px)"
    size="full"
    :state="syncModal">
    <div class="flex h-full w-full flex-col gap-4 overflow-hidden">
      <SyncConflictResolutionEditor
        :baseDocument="rebaseResult.originalDocument"
        :conflicts="rebaseResult.conflicts"
        :resolvedDocument="rebaseResult.resolvedDocument" />
    </div>
  </ScalarModal>
</template>

<style>
.full-size-styles:has(.sync-conflict-modal-root) {
  width: 100dvw !important;
  max-width: 100dvw !important;
  border-right: none !important;
}

.full-size-styles:has(.sync-conflict-modal-root)::after {
  display: none;
}
</style>
