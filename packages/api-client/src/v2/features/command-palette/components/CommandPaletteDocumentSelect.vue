<script lang="ts">
/**
 * Command Palette Document Selector
 *
 * Searchable combobox the document-aware command palette flows (Create
 * Request, Add Tag, Add Example) use to pick the workspace document
 * they target.
 *
 * Registry-grouped documents that have more than one loaded version
 * surface as a labelled section, with one row per loaded version. Every
 * other document is rendered as a flat row at the top of the list, so
 * single-version registry docs and standalone workspace docs all sit
 * next to each other without an awkward singleton header.
 *
 * The model value is a workspace document name (string), which is what
 * every consumer ultimately writes into its create / edit payload.
 */
export default {
  name: 'CommandPaletteDocumentSelect',
}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarCombobox,
  ScalarIcon,
  type ScalarComboboxFilterFunction,
  type ScalarComboboxOption,
  type ScalarComboboxOptionGroup,
} from '@scalar/components'
import { computed } from 'vue'

import type { CommandPaletteDocument } from '../hooks/use-command-palette-documents'

const {
  documents,
  modelValue,
  placeholder = 'Select Document',
  searchPlaceholder = 'Search documents',
  triggerClass,
} = defineProps<{
  /** Available documents, mirroring the sidebar grouping. */
  documents: CommandPaletteDocument[]
  /** Currently picked workspace document name, or `undefined` when nothing is selected. */
  modelValue: string | undefined
  /** Trigger placeholder rendered when nothing is picked. */
  placeholder?: string
  /** Placeholder rendered inside the search input. */
  searchPlaceholder?: string
  /** Extra classes forwarded to the trigger button (e.g. for width / layout control). */
  triggerClass?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', documentName: string): void
}>()

/**
 * Combobox option shape. We carry the document title alongside the row
 * label so the trigger can render `Doc · Version` for version rows
 * without having to look the parent group up again. Extending the
 * combobox's base `Option` shape keeps type inference happy when the
 * filter / model callbacks flow through the generic combobox API.
 */
type DocumentOption = ScalarComboboxOption & {
  /** Display label for the parent document group. Equal to `label` for non-version rows. */
  documentLabel: string
}

type DocumentOptionGroup = ScalarComboboxOptionGroup<DocumentOption>

/**
 * Build the grouped option list.
 *
 * The leading group has no label (the combobox auto-hides empty
 * headers) and contains the singleton rows: standalone documents and
 * registry docs that only have a single loaded version. Every
 * multi-version registry doc gets its own labelled group below, so the
 * user sees the document title once and the loaded versions underneath.
 */
const groups = computed<DocumentOptionGroup[]>(() => {
  const flat: DocumentOption[] = []
  const versioned: DocumentOptionGroup[] = []

  for (const doc of documents) {
    if (doc.versions?.length) {
      versioned.push({
        label: doc.label,
        options: doc.versions.map((v) => ({
          id: v.id,
          label: v.label,
          documentLabel: doc.label,
        })),
      })
    } else {
      flat.push({ id: doc.id, label: doc.label, documentLabel: doc.label })
    }
  }

  return [{ label: '', options: flat }, ...versioned]
})

const allOptions = computed<DocumentOption[]>(() =>
  groups.value.flatMap((g) => g.options),
)

/**
 * Resolve the picked option from the model. The combobox compares
 * options by reference, so we have to surface the object that lives
 * inside `groups` rather than build a fresh `{ id, label }` from the
 * model.
 */
const selectedOption = computed<DocumentOption | undefined>(() =>
  modelValue ? allOptions.value.find((o) => o.id === modelValue) : undefined,
)

/**
 * Match on the row label, the parent document title, and the group
 * label. Searching for a document title therefore returns every loaded
 * version of that document, even though the version rows themselves
 * carry the version string as their label.
 *
 * Typed against the combobox's base `Option` shape because that's what
 * Vue infers for the prop. `documentLabel` is read off each row via the
 * `DocumentOption` projection — the parent only ever passes rows that
 * carry that field, so the access is sound even though the generic
 * inference does not propagate it.
 */
const filterFn: ScalarComboboxFilterFunction = (
  query,
  options,
  optionGroups,
) => {
  if (!query) {
    return options
  }
  const q = query.toLowerCase()
  const matchedGroupOptionIds = new Set(
    optionGroups.flatMap((g) => {
      if (!g.label.toLowerCase().includes(q)) {
        return []
      }
      return g.options.map((o) => o.id)
    }),
  )
  return options.filter(
    (o) =>
      matchedGroupOptionIds.has(o.id) ||
      o.label.toLowerCase().includes(q) ||
      (o as DocumentOption).documentLabel.toLowerCase().includes(q),
  )
}

/**
 * Trigger summary text. Version rows render `Document · Version`, every
 * other row renders the row label as-is.
 */
const triggerLabel = computed<string>(() => {
  const opt = selectedOption.value
  if (!opt) {
    return placeholder
  }
  return opt.documentLabel === opt.label
    ? opt.label
    : `${opt.documentLabel} · ${opt.label}`
})

const handleSelect = (option: ScalarComboboxOption | undefined): void => {
  if (option) {
    emit('update:modelValue', option.id)
  }
}
</script>

<template>
  <ScalarCombobox
    class="w-72"
    :filterFn="filterFn"
    :modelValue="selectedOption"
    :options="groups"
    :placeholder="searchPlaceholder"
    @update:modelValue="handleSelect">
    <ScalarButton
      :class="[
        'hover:bg-b-2 max-h-8 justify-between gap-1 p-2 text-xs',
        triggerClass,
      ]"
      variant="outlined">
      <span :class="selectedOption ? 'text-c-1 truncate' : 'text-c-3'">
        {{ triggerLabel }}
      </span>
      <ScalarIcon
        class="text-c-3"
        icon="ChevronDown"
        size="md" />
    </ScalarButton>
  </ScalarCombobox>
</template>
