<script lang="ts">
/**
 * Full Postman collection import preview: metadata, request picker, merge target, and convert options.
 */
export default {
  name: 'PostmanImportPreview',
}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarCheckboxInput,
  ScalarIcon,
  ScalarListbox,
  ScalarTooltip,
  type ScalarListboxOption,
} from '@scalar/components'
import { computed } from 'vue'

const props = defineProps<{
  title: string
  version: string
  schema?: string
  totalRequests: number
  availableTargetDocuments: { slug: string; label: string }[]
  hasCollisionPathKeys: boolean
}>()

const slots = defineSlots<{
  treePicker: () => unknown
}>()

const selectedTargetDocument = defineModel<{
  slug: string
  label: string
} | null>('selectedTargetDocument')
const mergeSamePathAndMethod = defineModel<boolean>('mergeSamePathAndMethod')

/** Listbox id for "create a new document" — parent model stays `null`. */
const NEW_DOCUMENT_LISTBOX_ID = '__postman_import_new__'

const importDestinationOptions = computed<ScalarListboxOption[]>(() => [
  { id: NEW_DOCUMENT_LISTBOX_ID, label: 'New document' },
  ...props.availableTargetDocuments.map((d) => ({
    id: d.slug,
    label: d.label,
  })),
])

const resolvedImportDestinationOption = computed((): ScalarListboxOption => {
  const options = importDestinationOptions.value
  const fallback = options[0]!
  const sel = selectedTargetDocument.value
  if (!sel) {
    return fallback
  }
  return options.find((o) => o.id === sel.slug) ?? fallback
})

const onImportDestinationChange = (option: ScalarListboxOption): void => {
  if (option.id === NEW_DOCUMENT_LISTBOX_ID) {
    selectedTargetDocument.value = null
    return
  }
  selectedTargetDocument.value = {
    slug: option.id,
    label: option.label,
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-1.5 overflow-hidden">
    <div class="flex flex-1 flex-col gap-1.5 overflow-hidden">
      <div
        class="border-border bg-b-2 text-c-2 shrink-0 rounded border px-2.5 py-1.5 text-xs leading-tight">
        <div class="text-c-1 truncate font-medium">
          {{ title }}
        </div>
        <div
          class="text-c-3 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <template v-if="schema">
            <span class="whitespace-nowrap">
              {{ schema }}
            </span>
            <span
              aria-hidden="true"
              class="text-c-3 opacity-50">
              ·
            </span>
          </template>
          <span class="whitespace-nowrap"> v{{ version }} </span>
          <span
            aria-hidden="true"
            class="text-c-3 opacity-50">
            ·
          </span>
          <span class="whitespace-nowrap">
            {{ totalRequests }}
            {{ totalRequests === 1 ? 'request' : 'requests' }}
          </span>
        </div>
      </div>
      <div
        v-if="hasCollisionPathKeys"
        class="postman-import-path-conflict-callout w-full max-w-full rounded-md border px-2.5 py-1.5 text-xs leading-snug">
        <div class="[overflow-wrap:anywhere] [word-break:break-word]">
          <span class="font-semibold text-[var(--scalar-color-red)]">
            Conflict
          </span>
          <template v-if="selectedTargetDocument">
            — Same OpenAPI path + method as existing operations in
            <span class="font-medium">
              {{ selectedTargetDocument.label }}
            </span>
            .
            <template v-if="!mergeSamePathAndMethod">
              These will overwrite existing operations unless
              <span class="font-medium">Merge same path &amp; method</span>
              is enabled.
            </template>
            <template v-else>
              These will be merged with existing operations.
            </template>
          </template>
          <template v-else>
            — Same OpenAPI path + method for multiple selected requests. Turn on
            <span class="font-medium">Merge same path &amp; method</span>
            to combine them; otherwise the last one wins.
          </template>
        </div>
      </div>
    </div>
    <div class="h-[300px] overflow-y-auto">
      <slots.treePicker />
    </div>

    <section
      class="border-border bg-b-2 flex shrink-0 flex-col gap-3 rounded-md border px-2.5 py-2.5">
      <div
        v-if="availableTargetDocuments.length > 0"
        class="border-border flex flex-col gap-2 border-b border-dashed pb-3">
        <div>
          <p class="text-c-1 text-xs font-semibold tracking-tight">
            Import destination
          </p>
          <p class="text-c-3 mt-1 text-xs leading-snug">
            Put operations into an existing API description, or create a new
            document in this workspace.
          </p>
        </div>
        <ScalarListbox
          id="postman-import-target"
          label="Import destination"
          :modelValue="resolvedImportDestinationOption"
          :options="importDestinationOptions"
          placement="bottom-start"
          resize
          @update:modelValue="onImportDestinationChange">
          <ScalarButton
            class="hover:bg-b-2 h-9 w-full justify-between gap-2 px-2.5 py-2 text-left text-xs"
            variant="outlined">
            <span class="text-c-1 truncate font-medium">
              {{ resolvedImportDestinationOption.label }}
            </span>
            <ScalarIcon
              class="text-c-3 shrink-0"
              icon="ChevronDown"
              size="md" />
          </ScalarButton>
        </ScalarListbox>
      </div>
      <ScalarTooltip
        content="When several Postman requests map to the same OpenAPI path and HTTP method, merge them into one operation instead of keeping duplicate operations."
        placement="top">
        <div
          class="[&>label]:bg-transparent [&>label]:p-0 [&>label]:shadow-none [&>label]:hover:bg-transparent">
          <ScalarCheckboxInput v-model="mergeSamePathAndMethod">
            <span class="text-c-1 text-xs leading-snug font-medium">
              Merge same path &amp; method
            </span>
          </ScalarCheckboxInput>
        </div>
      </ScalarTooltip>
    </section>
  </div>
</template>

<style scoped>
.postman-import-path-conflict-callout {
  border-color: var(--scalar-color-red);
  background-color: var(--scalar-background-danger);
  color: var(--scalar-color-1);
}
</style>
