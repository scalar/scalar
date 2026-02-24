<script setup lang="ts">
import {
  ScalarButton,
  ScalarMarkdown,
  ScalarModal,
  ScalarToggle,
  useModal,
} from '@scalar/components'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { ScalarIconPencil } from '@scalar/icons'
import {
  computed,
  nextTick,
  ref,
  useTemplateRef,
  type ComputedRef,
  type Ref,
} from 'vue'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { CodeInput } from '@/v2/components/code-input'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import Section from '@/v2/features/settings/components/Section.vue'

const {
  document,
  eventBus,
  layout,
  collectionType,
  path,
  method,
  documentSlug,
} = defineProps<CollectionProps>()

const operationLabel = computed(() => {
  if (!method || !path) {
    return 'this operation'
  }
  const upperMethod = typeof method === 'string' ? method.toUpperCase() : method
  return `${upperMethod} ${path}`
})

const description: ComputedRef<string> = computed(() => {
  if (collectionType === 'operation') {
    if (!path || !method || !isHttpMethod(method)) {
      return ''
    }

    return document?.paths?.[path]?.[method]?.description ?? ''
  }

  return document?.info?.description ?? ''
})

const deprecated: ComputedRef<boolean> = computed(() => {
  if (collectionType !== 'operation' || !path || !isHttpMethod(method)) {
    return false
  }

  const operation = document?.paths?.[path]?.[method] as
    | { deprecated?: boolean }
    | undefined
  return operation?.deprecated ?? false
})

const mode: Ref<'edit' | 'preview'> = ref('preview')

const codeInputRef = useTemplateRef('codeInputRef')

/**
 * Switch between edit and preview modes.
 * When switching to edit mode, focus the input after the DOM updates.
 */
const switchMode = async (newMode: 'edit' | 'preview'): Promise<void> => {
  mode.value = newMode

  if (newMode === 'edit') {
    await nextTick()
    codeInputRef.value?.focus()
  }
}

/**
 * Updates the description of the collection
 * @param payload - The new description
 * @returns void
 */
const handleDescriptionUpdate = (payload: string) => {
  /** If the collection type is an operation, update the description of the operation */
  if (collectionType === 'operation') {
    if (!path || !method) {
      console.error('Invalid path or method', { path, method })
      return
    }

    return eventBus.emit('operation:update:meta', {
      meta: { path, method },
      payload: {
        description: payload,
      },
    })
  }

  /** If the collection type is a document, update the description of the document */
  if (collectionType === 'document') {
    return eventBus.emit('document:update:info', { description: payload })
  }

  console.error('Invalid collection type', { collectionType })
}

const handleDeprecatedChange = (value: boolean) => {
  if (collectionType !== 'operation' || !path || !method) {
    return
  }

  eventBus.emit('operation:update:meta', {
    meta: { path, method },
    payload: { deprecated: value },
  })
}

const deleteOperationModal = useModal()

const handleDeleteOperation = () => {
  if (collectionType !== 'operation' || !path || !method || !documentSlug) {
    return
  }

  eventBus.emit('operation:delete:operation', {
    documentName: documentSlug,
    meta: { path, method },
  })
  deleteOperationModal.hide()
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <Section>
      <template #title>Description</template>
      <template #actions>
        <ScalarButton
          v-if="mode === 'preview'"
          class="text-c-2 hover:text-c-1 flex items-center gap-2"
          size="sm"
          type="button"
          variant="outlined"
          @click="switchMode('edit')">
          <ScalarIconPencil
            size="sm"
            thickness="1.5" />
          <span>Edit</span>
        </ScalarButton>
      </template>
      <div class="has-focus-visible:bg-b-1 group rounded-lg">
        <!-- Preview -->
        <template v-if="mode === 'preview'">
          <template v-if="description.trim().length">
            <ScalarMarkdown
              class="flex-1 rounded border border-transparent p-1.5 hover:border-(--scalar-background-3)"
              :value="description"
              withImages
              @dblclick="switchMode('edit')" />
            <div
              class="brightness-lifted bg-b-1 absolute inset-0 -z-1 hidden rounded group-hover:block group-has-focus-visible:hidden" />
          </template>

          <div
            v-else
            class="text-c-3 flex items-center justify-center rounded-lg border p-4">
            <ScalarButton
              class="hover:bg-b-2 hover:text-c-1 text-c-2 flex items-center gap-2"
              size="sm"
              variant="ghost"
              @click="switchMode('edit')">
              <ScalarIconPencil
                size="sm"
                thickness="1.5" />
              <span>Write a description</span>
            </ScalarButton>
          </div>
        </template>

        <!-- Edit -->
        <template v-else>
          <CodeInput
            ref="codeInputRef"
            class="border px-0.5 py-0"
            :environment="undefined"
            :layout="layout"
            :modelValue="description"
            @blur="switchMode('preview')"
            @update:modelValue="handleDescriptionUpdate" />
        </template>
      </div>
    </Section>

    <!-- Operation-only: Status and Danger Zone -->
    <template v-if="collectionType === 'operation'">
      <Section>
        <template #title>Status</template>
        <div
          class="rounded-lg border text-sm transition-colors"
          :class="
            deprecated
              ? 'border-(--scalar-color-alert) bg-(--scalar-background-alert)'
              : 'bg-b-2 border-(--scalar-background-3)'
          ">
          <div class="flex items-center justify-between gap-4 rounded-lg p-4">
            <div class="min-w-0 flex-1">
              <h4
                class="font-medium"
                :class="
                  deprecated ? 'text-(--scalar-color-alert)' : 'text-c-1'
                ">
                Deprecated
              </h4>
              <p class="text-c-2 mt-1.5">
                Mark this operation as deprecated. Consumers SHOULD refrain from
                using it.
              </p>
            </div>
            <ScalarToggle
              class="shrink-0"
              :modelValue="deprecated"
              @update:modelValue="handleDeprecatedChange" />
          </div>
        </div>
      </Section>

      <Section>
        <template #title>Danger Zone</template>
        <div
          class="bg-b-2 flex items-center justify-between gap-4 rounded-lg border border-(--scalar-background-3) p-4 text-sm">
          <div class="min-w-0 flex-1">
            <h4 class="text-c-1 font-medium">Delete Operation</h4>
            <p class="text-c-2 mt-1.5">
              Be careful, my friend. Once deleted, there is no way to recover
              the operation.
            </p>
          </div>
          <ScalarButton
            class="shrink-0"
            size="sm"
            variant="danger"
            @click="deleteOperationModal.show()">
            Delete Operation
          </ScalarButton>
        </div>
      </Section>
    </template>
  </div>

  <!-- Delete Operation Modal -->
  <ScalarModal
    :size="'xxs'"
    :state="deleteOperationModal"
    :title="`Delete ${operationLabel}`">
    <DeleteSidebarListElement
      :variableName="operationLabel"
      warningMessage="This action cannot be undone."
      @close="deleteOperationModal.hide()"
      @delete="handleDeleteOperation" />
  </ScalarModal>
</template>

<style scoped>
:deep(.cm-content) {
  min-height: fit-content;
}
:deep(.cm-scroller) {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
