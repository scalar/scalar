<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  ScalarToggle,
  useModal,
} from '@scalar/components'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'

const {
  documentUrl,
  watchMode,
  title,
  isDraftDocument = false,
} = defineProps<{
  /** Document source url if available */
  documentUrl?: string
  /** Watch mode status if also document url is provided */
  watchMode?: boolean
  /** Document title */
  title: string
  /** Whether the document is a draft document */
  isDraftDocument?: boolean
}>()

const emit = defineEmits<{
  /** Delete current document */
  (e: 'delete:document'): void
  /** Update watch mode status */
  (e: 'update:watchMode', value: boolean): void
}>()

const deleteModal = useModal()

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
</script>

<template>
  <div class="flex flex-col gap-12">
    <div class="flex flex-col gap-2">
      <div class="flex h-8 items-center">
        <h3 class="font-bold">Features</h3>
      </div>
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
        <div
          class="text-c-1 flex items-center overflow-x-auto border-t py-1.5 whitespace-nowrap">
          <div class="flex items-center">
            <template v-if="documentUrl">
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
            </template>
            <template v-else>
              <ScalarIcon
                class="text-c-2 mr-2 ml-3 w-4"
                icon="NotAllowed"
                size="sm" />
              <span class="text-c-2 pr-3">
                No URL configured. Try importing an OpenAPI document from an
                URL.
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="flex flex-col gap-4">
      <h3 class="font-bold">Danger Zone</h3>
      <div
        class="flex items-center justify-between rounded-lg border p-3 text-sm">
        <div>
          <h4>Delete Collection</h4>
          <p class="text-c-2 mt-1">
            Be careful, my friend. Once deleted, there is no way to recover the
            collection.
          </p>
        </div>
        <!-- user can not delete draft documents -->
        <ScalarButton
          :disabled="isDraftDocument"
          size="sm"
          variant="danger"
          @click="handleDeleteClick">
          Delete Collection
        </ScalarButton>
      </div>
    </div>
  </div>
  <!-- Delete Modal -->
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
</template>
