<script lang="ts">
/**
 * Command Palette Import Postman Component
 *
 * Imports Postman collections from URL, file, or pasted JSON, including
 * request selection, merge-into-existing, and convert options.
 */
export default {
  name: 'CommandPaletteImportPostman',
}
</script>

<script setup lang="ts">
import { useLoadingState } from '@scalar/components'
import type { ConvertOptions } from '@scalar/postman-to-openapi'
import { useToasts } from '@scalar/use-toasts'
import { type WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, watch } from 'vue'

import PostmanImportPreview from '@/v2/features/command-palette/components/PostmanImportPreview.vue'
import PostmanRequestTreeRow from '@/v2/features/command-palette/components/PostmanRequestTreeRow.vue'
import { generateUniqueSlug } from '@/v2/features/command-palette/helpers/generate-unique-slug'
import { getOpenApiFromPostman } from '@/v2/features/command-palette/helpers/get-openapi-from-postman'
import { getPostmanConvertOptions } from '@/v2/features/command-palette/helpers/get-postman-convert-options'
import { getPostmanDocumentDetails } from '@/v2/features/command-palette/helpers/get-postman-document-details'
import { getCollidingPostmanRequestPathKeys } from '@/v2/features/command-palette/helpers/postman-request-collisions'
import {
  applyPostmanFolderSelectionChange,
  applyPostmanRequestSelectionChange,
  buildPostmanRequestTree,
  countPostmanRequestLeaves,
  type PostmanTreeNode,
} from '@/v2/features/command-palette/helpers/postman-request-tree'

import CommandActionForm from './CommandActionForm.vue'

const {
  workspaceStore,
  eventBus,
  inputValue = '',
} = defineProps<{
  workspaceStore: WorkspaceStore
  /** Event bus for emitting import events */
  eventBus: WorkspaceEventBus
  /** Pre-filled collection JSON (e.g. from file pick or redirected paste) */
  inputValue: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

const { toast } = useToasts()

const loader = useLoadingState()

/** Document name to merge imported operations into. */
const importTargetDocumentName = ref<{ slug: string; label: string } | null>(
  null,
)
const baseDocument = ref<OpenApiDocument | null>(null)

watch(importTargetDocumentName, async (value) => {
  if (!value) {
    baseDocument.value = null
    return
  }
  const editable = await workspaceStore.getEditableDocument(value.slug)
  baseDocument.value = isOpenApiDocument(editable) ? editable : null
})

const mergeSamePathAndMethod = ref(false)

const postmanDocumentDetails = computed(() =>
  getPostmanDocumentDetails(inputValue),
)
const postmanRequestTree = computed(() =>
  buildPostmanRequestTree(postmanDocumentDetails.value?.collection ?? []),
)

/** Path keys to import from the Postman collection. */
const importPathKeys = ref<string[]>([])

const onPostmanRequestSelectionChange = (
  key: string,
  selected: boolean,
): void => {
  importPathKeys.value = applyPostmanRequestSelectionChange(
    importPathKeys.value,
    key,
    selected,
  )
}

const onPostmanFolderSelectionChange = (
  node: PostmanTreeNode,
  selected: boolean,
): void => {
  importPathKeys.value = applyPostmanFolderSelectionChange(
    importPathKeys.value,
    node,
    selected,
  )
}

/** Wraps all top-level nodes in a single root folder so the tree row handles select-all. */
const rootTreeNode = computed<PostmanTreeNode>(() => ({
  path: [],
  name: postmanDocumentDetails.value?.title ?? 'Collection',
  isFolder: true,
  children: postmanRequestTree.value,
}))

const collisionsPathKeys = computed(() => {
  return getCollidingPostmanRequestPathKeys(
    postmanDocumentDetails.value?.collection ?? [],
    importPathKeys.value,
    baseDocument.value ?? undefined,
  )
})

/** Navigate to a document in the workspace. */
const navigateToDocument = (documentName: string): void => {
  eventBus.emit('ui:navigate', {
    page: 'document',
    path: 'overview',
    documentSlug: documentName,
  })
}

/** Handle import error. */
const handleImportError = async (errorMessage: string): Promise<void> => {
  console.error(errorMessage)
  toast(errorMessage, 'error')
  await loader.invalidate()
  emit('close')
}

/** Handle import. */
const handleImport = async (): Promise<void> => {
  loader.start()

  const mergeTarget = importTargetDocumentName.value?.slug ?? ''
  const mergeIntoExisting =
    mergeTarget.length > 0 &&
    workspaceStore.workspace.documents[mergeTarget] !== undefined

  const targetDocument = mergeIntoExisting
    ? await workspaceStore.getEditableDocument(mergeTarget)
    : null

  const options: ConvertOptions = getPostmanConvertOptions({
    document: (targetDocument as unknown) ?? undefined,
    mergeOperation: mergeSamePathAndMethod.value,
    importPathKeys: importPathKeys.value,
  })

  const document = getOpenApiFromPostman(inputValue ?? '', options)

  if (document === null) {
    return handleImportError(
      'Failed to convert Postman collection to OpenAPI document. Please contact support.',
    )
  }

  if (mergeIntoExisting) {
    await workspaceStore.replaceDocument(mergeTarget, document)
    await loader.validate()
    navigateToDocument(mergeTarget)
    emit('close')
    return
  }

  // Otherwise create a new document
  const slug = await generateUniqueSlug(
    document.info?.title ?? 'default',
    new Set(Object.keys(workspaceStore.workspace.documents)),
  )

  if (!slug) {
    return handleImportError(
      'Failed to generate a unique slug for the imported document. Please contact support.',
    )
  }

  await workspaceStore.addDocument({
    name: slug,
    document,
  })

  await loader.validate()
  navigateToDocument(slug)
  emit('close')
}
</script>
<template>
  <CommandActionForm
    :loader
    @submit="handleImport">
    <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
      <div class="flex shrink-0 justify-between">
        <div class="text-c-2 min-h-7 w-full py-1.5 pl-12 text-center text-xs">
          Postman collection
        </div>
      </div>

      <!-- Postman collection preview and tree picker -->
      <PostmanImportPreview
        v-if="postmanDocumentDetails"
        v-model:mergeSamePathAndMethod="mergeSamePathAndMethod"
        v-model:selectedTargetDocument="importTargetDocumentName"
        :availableTargetDocuments="
          Object.entries(workspaceStore.workspace.documents).map(
            ([slug, document]) => ({
              slug,
              label: document.info?.title ?? slug,
            }),
          )
        "
        :hasCollisionPathKeys="collisionsPathKeys.length > 0"
        :schema="postmanDocumentDetails?.schemaLabel ?? undefined"
        :title="postmanDocumentDetails?.title ?? ''"
        :totalRequests="
          countPostmanRequestLeaves(postmanDocumentDetails?.collection ?? [])
        "
        :version="postmanDocumentDetails?.version ?? ''">
        <!-- Tree picker slot -->
        <template #treePicker>
          <PostmanRequestTreeRow
            :collisionPathKeys="collisionsPathKeys"
            :mergeSamePathAndMethod="mergeSamePathAndMethod"
            :node="rootTreeNode"
            :selectedKeys="importPathKeys"
            @folderSelectionChange="onPostmanFolderSelectionChange"
            @requestSelectionChange="onPostmanRequestSelectionChange" />
        </template>
      </PostmanImportPreview>
    </div>
    <template #submit> Import Postman Collection </template>
  </CommandActionForm>
</template>
