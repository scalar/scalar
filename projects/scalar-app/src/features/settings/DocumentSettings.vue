<script setup lang="ts">
import { DeleteSidebarListElement } from '@scalar/api-client/components/Sidebar'
import { ScalarButton } from '@scalar/components/button'
import { ScalarIcon } from '@scalar/components/icon'
import { ScalarModal, useModal } from '@scalar/components/modal'
import { ScalarTextInput } from '@scalar/components/text-input'
import { ScalarToggle } from '@scalar/components/toggle'
import { computed, ref, watch } from 'vue'

import Section from './components/Section.vue'
import DeleteRegistryConfirmModal from './DeleteRegistryConfirmModal.vue'

const {
  documentUrl,
  watchMode,
  title,
  isDraftDocument = false,
  registryMeta,
} = defineProps<{
  /** Document source url if available */
  documentUrl?: string
  /** Watch mode status if also document url is provided */
  watchMode?: boolean
  /** Document title */
  title: string
  /** Whether the document is a draft document */
  isDraftDocument?: boolean
  /**
   * Registry coordinates of the active document. Provided by the
   * parent only when the document is backed by a registry entry AND a
   * registry adapter is wired up. Drives the visibility and the
   * typed-confirmation phrase of the destructive registry-delete
   * affordances. Omit on documents that only exist locally so the
   * registry-side sections stay hidden.
   *
   * `isVersionPublished` flips off when the current version was
   * created locally but has not been published to the registry yet -
   * we render the standard local "Delete Collection" button in that
   * case so the user does not get a confusing NOT_FOUND from the
   * registry. The group itself is always considered published when
   * `registryMeta` is present at all (freshly created documents
   * carry no registry meta).
   */
  registryMeta?: {
    namespace: string
    slug: string
    version: string
    isVersionPublished: boolean
  }
}>()

const emit = defineEmits<{
  /** Delete current document */
  (e: 'delete:document'): void
  /** Update watch mode status */
  (e: 'update:watchMode', value: boolean): void
  /** Re-point the document at a different source url */
  (e: 'update:documentUrl', value: string): void
  /**
   * Fired when the user confirms the destructive "Delete this version"
   * flow. The parent owns the actual adapter call and resolves `done`
   * with `{ ok: true }` to close the modal or `{ ok: false, message }`
   * to surface an inline error so the user can retry.
   */
  (
    e: 'delete:registryVersion',
    payload: {
      done: (outcome: { ok: true } | { ok: false; message: string }) => void
    },
  ): void
  /**
   * Fired when the user confirms the destructive "Delete document from
   * registry" flow. Mirrors `delete:registryVersion` so the parent can
   * keep both flows on the same `done`-callback contract.
   */
  (
    e: 'delete:registryDocument',
    payload: {
      done: (outcome: { ok: true } | { ok: false; message: string }) => void
    },
  ): void
}>()

const deleteModal = useModal()
const deleteVersionModal = useModal()
const deleteRegistryDocumentModal = useModal()

/**
 * Local edit state for the Watch Mode source url. The link is swapped
 * for a text input while editing so the user can re-point the document
 * at a different source without having to delete and re-import it.
 */
const isEditingSource = ref(false)
const sourceDraft = ref(documentUrl ?? '')

// The trimmed draft drives both the empty-guard on the Save button and
// the value we emit, so the two never disagree.
const trimmedSourceDraft = computed(() => sourceDraft.value.trim())

// Keep the draft in sync when the source changes elsewhere. While the
// user is editing we only follow along when they have not diverged from
// the value they started with (the draft still matches the previous
// prop). That way in-flight typing is never clobbered, but the async
// echo of a just-saved url does not leave us seeded from a stale prop
// either - reopening Edit right after a save shows the new source.
watch(
  () => documentUrl,
  (value, oldValue) => {
    if (!isEditingSource.value || sourceDraft.value === (oldValue ?? '')) {
      sourceDraft.value = value ?? ''
    }
  },
)

const startEditingSource = () => {
  sourceDraft.value = documentUrl ?? ''
  isEditingSource.value = true
}

const cancelEditingSource = () => {
  sourceDraft.value = documentUrl ?? ''
  isEditingSource.value = false
}

const saveSource = () => {
  const next = trimmedSourceDraft.value

  // Watch mode needs a url to poll, so we never persist an empty source.
  // Clearing it would disable the toggle and strand watch mode in its
  // current state. The Save button is disabled here too; this guards the
  // Enter-to-save path.
  if (!next) {
    return
  }

  // Nothing to do when the source did not actually change.
  if (next === (documentUrl ?? '')) {
    isEditingSource.value = false
    return
  }

  emit('update:documentUrl', next)
  isEditingSource.value = false
}

/**
 * Handles the delete button click.
 * Prevents opening the modal if the document is a draft.
 */
const handleDeleteClick = () => {
  if (isDraftDocument) {
    return
  }
  deleteModal.show()
}

const handleDocumentDelete = () => {
  emit('delete:document')
  deleteModal.hide()
}

const handleDeleteVersionClick = () => {
  if (!registryMeta?.isVersionPublished) {
    return
  }
  deleteVersionModal.show()
}

const handleDeleteRegistryDocumentClick = () => {
  if (!registryMeta) {
    return
  }
  deleteRegistryDocumentModal.show()
}

const handleDeleteRegistryVersionSubmit = (payload: {
  done: (outcome: { ok: true } | { ok: false; message: string }) => void
}) => {
  emit('delete:registryVersion', payload)
}

const handleDeleteRegistryDocumentSubmit = (payload: {
  done: (outcome: { ok: true } | { ok: false; message: string }) => void
}) => {
  emit('delete:registryDocument', payload)
}
</script>

<template>
  <div class="flex flex-col gap-12">
    <Section>
      <template #title>Features</template>
      <!-- Watch Mode -->
      <div class="bg-b-2 rounded-lg border text-sm">
        <div
          class="bg-b-1 flex items-center justify-between gap-4 rounded-t-lg p-3">
          <div>
            <h4>Watch Mode</h4>
            <p class="text-c-2 mt-1">
              When enabled, the OpenAPI document will be polled for changes. The
              collection will be updated automatically.
            </p>
          </div>
          <ScalarToggle
            class="w-4"
            :disabled="!documentUrl"
            :modelValue="watchMode ?? false"
            @update:modelValue="(value) => emit('update:watchMode', value)" />
        </div>
        <div class="text-c-1 flex items-center border-t py-1.5">
          <!-- Editing: re-point the document at a different source url. -->
          <template v-if="isEditingSource">
            <span class="pr-2 pl-3">Source</span>
            <ScalarTextInput
              v-model="sourceDraft"
              autofocus
              class="min-w-0 flex-1"
              placeholder="https://example.com/openapi.json"
              @keydown.enter="saveSource"
              @keydown.esc="cancelEditingSource" />
            <div class="flex shrink-0 items-center gap-2 pr-3 pl-2">
              <ScalarButton
                size="sm"
                variant="ghost"
                @click="cancelEditingSource">
                Cancel
              </ScalarButton>
              <ScalarButton
                :disabled="!trimmedSourceDraft"
                size="sm"
                @click="saveSource">
                Save
              </ScalarButton>
            </div>
          </template>
          <!-- Existing source: link out, with an affordance to edit it. -->
          <div
            v-else-if="documentUrl"
            class="flex w-full items-center overflow-x-auto">
            <span class="bg-b-2 sticky left-0 pr-2 pl-3">Source</span>
            <a
              class="text-c-2 group rounded pr-3 no-underline hover:underline"
              :href="documentUrl"
              target="_blank">
              {{ documentUrl }}
              <ScalarIcon
                class="ml-1 hidden w-2.5 group-hover:inline"
                icon="ExternalLink" />
            </a>
            <ScalarButton
              class="bg-b-2 sticky right-0 ml-auto shrink-0"
              size="sm"
              variant="ghost"
              @click="startEditingSource">
              Edit
            </ScalarButton>
          </div>
          <!-- No source yet: let the user add one to enable watch mode. -->
          <div
            v-else
            class="flex w-full items-center">
            <ScalarIcon
              class="text-c-2 mr-2 ml-3 w-4"
              icon="NotAllowed"
              size="sm" />
            <span class="text-c-2 pr-3">
              No URL configured. Try importing an OpenAPI document from an URL.
            </span>
            <ScalarButton
              class="mr-3 ml-auto shrink-0"
              size="sm"
              variant="ghost"
              @click="startEditingSource">
              Add
            </ScalarButton>
          </div>
        </div>
      </div>
    </Section>

    <!-- Danger Zone -->
    <Section>
      <template #title>Danger Zone</template>
      <!--
        Registry-backed documents pick their per-version affordance
        based on whether the active version has actually been
        published. Published versions go through the registry delete
        flow (which also wipes the local copy on success); draft
        versions that only exist locally fall back to the standard
        "Delete Collection" button so we do not call the registry
        with a coordinate it has never heard of.

        The group-wide "Delete from registry" button is always
        rendered alongside, because the presence of `registryMeta`
        already implies the document group exists on the registry -
        freshly created documents have no registry meta at all and
        fall through to the standalone branch below.
      -->
      <div
        v-if="registryMeta"
        class="flex flex-col gap-3">
        <!-- Published version: registry-side delete. -->
        <div
          v-if="registryMeta.isVersionPublished"
          class="flex flex-col items-center justify-between gap-4 rounded-lg border p-3 text-sm sm:flex-row">
          <div class="min-w-0 flex-1">
            <h4>Delete this version from the registry</h4>
            <p class="text-c-2 mt-1">
              Removes
              <span class="text-c-1 font-mono break-all">
                @{{ registryMeta.namespace }}/{{ registryMeta.slug }}@{{
                  registryMeta.version
                }}
              </span>
              from the registry and deletes the local copy. This action cannot
              be undone.
            </p>
          </div>
          <ScalarButton
            size="sm"
            variant="danger"
            @click="handleDeleteVersionClick">
            Delete Version
          </ScalarButton>
        </div>
        <!--
          Draft version: only exists in this workspace. We delete it
          locally without bothering the registry so the user does not
          see a NOT_FOUND error for a version that was never
          published.
        -->
        <div
          v-else
          class="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
          <div class="min-w-0 flex-1">
            <h4>Delete this draft version</h4>
            <p class="text-c-2 mt-1">
              Version
              <span class="text-c-1 font-mono break-all">{{
                registryMeta.version
              }}</span>
              of
              <span class="text-c-1 font-mono break-all">
                @{{ registryMeta.namespace }}/{{ registryMeta.slug }}
              </span>
              has not been published yet. Deleting it removes the local copy
              only - the registry is left untouched.
            </p>
          </div>
          <ScalarButton
            class="shrink-0"
            :disabled="isDraftDocument"
            size="sm"
            variant="danger"
            @click="handleDeleteClick">
            Delete Collection
          </ScalarButton>
        </div>

        <div
          class="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
          <div class="min-w-0 flex-1">
            <h4>Delete document from the registry</h4>
            <p class="text-c-2 mt-1">
              Removes every version of
              <span class="text-c-1 font-mono break-all">
                @{{ registryMeta.namespace }}/{{ registryMeta.slug }}
              </span>
              from the registry and deletes every local copy. This action cannot
              be undone.
            </p>
          </div>
          <ScalarButton
            class="shrink-0"
            size="sm"
            variant="danger"
            @click="handleDeleteRegistryDocumentClick">
            Delete Document
          </ScalarButton>
        </div>
      </div>
      <!-- Local-only delete for standalone (non-registry) documents. -->
      <div
        v-else
        class="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
        <div class="min-w-0 flex-1">
          <h4>Delete Collection</h4>
          <p class="text-c-2 mt-1">
            Be careful, my friend. Once deleted, there is no way to recover the
            collection.
          </p>
        </div>
        <!-- user can not delete draft documents -->
        <ScalarButton
          class="shrink-0"
          :disabled="isDraftDocument"
          size="sm"
          variant="danger"
          @click="handleDeleteClick">
          Delete Collection
        </ScalarButton>
      </div>
    </Section>
  </div>

  <!-- Local delete confirmation -->
  <ScalarModal
    :size="'xxs'"
    :state="deleteModal"
    :title="`Delete ${title}`">
    <DeleteSidebarListElement
      :variableName="title ?? ''"
      warningMessage="This action cannot be undone."
      @close="deleteModal.hide()"
      @delete="handleDocumentDelete" />
  </ScalarModal>

  <!--
    Registry-version delete confirmation. Only mounted when the
    version is actually published to the registry; draft versions go
    through the local delete flow above and never reach this modal.
  -->
  <DeleteRegistryConfirmModal
    v-if="registryMeta?.isVersionPublished"
    mode="version"
    :namespace="registryMeta.namespace"
    :slug="registryMeta.slug"
    :state="deleteVersionModal"
    :version="registryMeta.version"
    @submit="handleDeleteRegistryVersionSubmit" />

  <!--
    Registry-document delete confirmation. Same component as the
    version flow, switched into `mode="document"` so it asks for
    `@namespace/slug` (without the `@version` suffix) and the parent
    knows to wipe every workspace doc that pointed at the same
    coordinates after the registry confirms the deletion.
  -->
  <DeleteRegistryConfirmModal
    v-if="registryMeta"
    mode="document"
    :namespace="registryMeta.namespace"
    :slug="registryMeta.slug"
    :state="deleteRegistryDocumentModal"
    @submit="handleDeleteRegistryDocumentSubmit" />
</template>
