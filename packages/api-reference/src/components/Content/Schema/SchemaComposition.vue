<script lang="ts" setup>
import {
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components/listbox'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { resolve } from '@scalar/workspace-store/resolve'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, inject, ref, watch } from 'vue'

import type { SchemaOptions } from '@/components/Content/Schema/types'
import { useLocalization } from '@/features/localization'
import {
  REQUEST_BODY_COMPOSITION_INDEX_SYMBOL,
  type RequestBodyCompositionSelection,
} from '@/features/Operation/request-body-composition-index'

import { getSchemaType } from './helpers/get-schema-type'
import { partitionAllOfCompositions } from './helpers/partition-all-of-compositions'
import { type CompositionKeyword } from './helpers/schema-composition'
import { getCycleKey } from './helpers/schema-cycle'
import { getModelNameFromSchema } from './helpers/schema-name'
import Schema from './Schema.vue'

const props = withDefaults(
  defineProps<{
    /** The composition keyword (oneOf, anyOf, allOf) */
    composition: CompositionKeyword
    /** Optional discriminator object for polymorphic schemas */
    discriminator?: DiscriminatorObject
    /** Optional name for the schema */
    name?: string
    /** The schema value containing the composition */
    schema: SchemaObject
    /** Nesting level for proper indentation */
    level: number
    /** Whether to use compact layout */
    compact?: boolean
    /** Whether to hide the heading */
    hideHeading?: boolean
    /** Hide model names in type display */
    hideModelNames?: boolean
    /** Breadcrumb for navigation */
    breadcrumb?: string[]
    /** Event bus emitting actions */
    eventBus: WorkspaceEventBus | null
    /** Move the options into  single prop so they are easy to pass around */
    options: SchemaOptions
    /** When "requestBody", sync selected index with the example snippet */
    schemaContext?: string
    /** Internal path used to sync nested request body compositions with the code sample */
    compositionPath?: string[]
  }>(),
  {
    compact: false,
    hideHeading: false,
  },
)
const { translate } = useLocalization()

/**
 * Split an `allOf` into an ordered list of segments (object chunks + choice
 * pickers) so multiple mutually-exclusive selections each render their own
 * picker, in the position they were declared, instead of all but the first
 * being dropped and the rest bubbling to the end.
 */
const allOfSegments = computed(() =>
  props.composition === 'allOf'
    ? partitionAllOfCompositions(props.schema).segments
    : [],
)

/** The current composition */
const composition = computed(() =>
  [props.schema[props.composition]]
    .flat()
    .map((schema) => ({ value: resolve.schema(schema), original: schema }))
    .filter((it) => isDefined(it.value)),
)

/**
 * Generate listbox options for the composition selector.
 * Each option represents a schema in the composition with a human-readable label.
 * Prefers schema title/name over structural type when present.
 */
const listboxOptions = computed((): ScalarListboxOption[] =>
  composition.value.map((schema, index: number) => {
    const resolved = resolve.schema(schema.original!)
    const label =
      (getModelNameFromSchema(resolved)?.label ?? getSchemaType(resolved)) ||
      translate('schema.schema')
    return { id: String(index), label }
  }),
)

const compositionSelectionKey = computed(() =>
  props.compositionPath?.length
    ? [...props.compositionPath, props.composition].join('.')
    : '',
)

/** When this composition is in the request body, sync selection with the example snippet */
const requestBodyCompositionSelectionRef = inject(
  REQUEST_BODY_COMPOSITION_INDEX_SYMBOL,
  undefined,
)

const initialSelectedIndex = computed(() => {
  if (
    props.schemaContext !== 'requestBody' ||
    !requestBodyCompositionSelectionRef?.value ||
    !compositionSelectionKey.value
  ) {
    return 0
  }

  const selectedIndex =
    requestBodyCompositionSelectionRef.value[compositionSelectionKey.value]

  if (typeof selectedIndex !== 'number' || Number.isNaN(selectedIndex)) {
    return 0
  }

  return Math.max(0, Math.min(selectedIndex, listboxOptions.value.length - 1))
})

/**
 * Two-way computed property for the selected option.
 * Handles conversion between the selected index and the listbox option format.
 */
const selectedOption = ref<ScalarListboxOption | undefined>()

watch(
  [listboxOptions, initialSelectedIndex],
  ([options, selectedIndex]) => {
    if (
      !selectedOption.value ||
      !options.some((option) => option.id === selectedOption.value?.id)
    ) {
      selectedOption.value = options[selectedIndex] ?? options[0]
    }
  },
  { immediate: true },
)

const compositionLabel = (type: CompositionKeyword): string =>
  translate(`schema.${type}`)

/** Inside the currently selected composition */
const selectedComposition = computed(
  () => composition.value[Number(selectedOption.value?.id ?? '0')]?.value,
)

/**
 * The request body card renders the merged `allOf` description on its outer card
 * (see `Schema.vue`), but only for the top-level request body schema. For that
 * single composition we hide the nested merged `Schema`'s description so the text
 * is not shown twice. Nested request-body compositions (deeper properties) are
 * not shown on the outer card and would otherwise lose their description
 * entirely, because the property row already skips it when `allOf` is present.
 *
 * The top-level request body composition is the one whose `compositionPath` is
 * still the request body root (`['requestBody']`); nested compositions append
 * property segments and therefore have a longer path.
 */
const isRequestBodyRootComposition = computed(
  () =>
    props.schemaContext === 'requestBody' &&
    props.compositionPath?.length === 1,
)

/**
 * Cycle key for the selected composition member, derived from its raw
 * (unresolved) value so a member that references an ancestor is detected as a
 * cycle.
 */
const selectedCompositionCycleKey = computed(() =>
  getCycleKey(
    composition.value[Number(selectedOption.value?.id ?? '0')]?.original,
  ),
)

/**
 * Controls whether the nested schema is displayed. When expanding all schema
 * properties we open it by default; the nested Schema handles cycle detection,
 * so finite compositions render fully while recursive ones still stop.
 */
const showNestedSchema = ref(!!props.options.expandAllSchemaProperties)

if (
  requestBodyCompositionSelectionRef &&
  props.schemaContext === 'requestBody' &&
  compositionSelectionKey.value
) {
  watch(
    selectedOption,
    (option) => {
      const index = option ? Number(option.id) : 0
      if (!Number.isNaN(index)) {
        requestBodyCompositionSelectionRef.value = {
          ...requestBodyCompositionSelectionRef.value,
          [compositionSelectionKey.value]: index,
        } satisfies RequestBodyCompositionSelection
      }
    },
    { immediate: true },
  )
}
</script>

<template>
  <div class="property-rule">
    <!--
      allOf: render the members in source order — object chunks as fields, each
      oneOf/anyOf group as its own picker in place. Keeps every mutually-exclusive
      selection (mergeAllOfSchemas alone drops all but the first) and preserves the
      position of each choice group among the surrounding fields, flowing inline
      with them as one continuous list (no extra spacing or card).
    -->
    <template v-if="props.composition === 'allOf'">
      <template
        v-for="(segment, segmentIndex) in allOfSegments"
        :key="segmentIndex">
        <Schema
          v-if="segment.kind === 'object'"
          :breadcrumb="breadcrumb"
          :compact="compact"
          :compositionPath="compositionPath"
          :discriminator="discriminator"
          :eventBus="eventBus"
          :hideDescription="isRequestBodyRootComposition"
          :hideHeading="hideHeading"
          :hideModelNames
          :level="level + 1"
          :name="name"
          :noncollapsible="true"
          :options="options"
          :schema="segment.schema"
          :schemaContext="schemaContext" />
        <SchemaComposition
          v-else
          :breadcrumb="breadcrumb"
          :compact="compact"
          :composition="segment.composition"
          :compositionPath="[
            ...(compositionPath ?? []),
            String(segment.choiceIndex),
          ]"
          :eventBus="eventBus"
          :hideHeading="hideHeading"
          :hideModelNames
          :level="level"
          :options="options"
          :schema="segment.value"
          :schemaContext="schemaContext" />
      </template>
    </template>

    <template v-else>
      <!-- Composition selector + selected branch -->
      <ScalarListbox
        v-model="selectedOption"
        :options="listboxOptions"
        resize>
        <button
          class="composition-selector bg-b-1.5 hover:bg-b-2 flex w-full cursor-pointer items-center gap-1 rounded-t-lg border px-2.5 py-2.5 pr-3 text-left"
          type="button">
          <span class="text-c-2">{{
            compositionLabel(props.composition)
          }}</span>
          <span
            class="composition-selector-label text-c-1"
            :class="{
              'line-through': selectedComposition?.deprecated,
            }">
            {{ selectedOption?.label || translate('schema.schema') }}
          </span>
          <div
            v-if="selectedComposition?.deprecated"
            class="text-red">
            {{ translate('common.deprecated') }}
          </div>
          <ScalarIconCaretDown />
        </button>
      </ScalarListbox>

      <div class="composition-panel">
        <!-- Button to toggle nested schema display -->
        <button
          v-if="!showNestedSchema && level > 2"
          class="bg-b-1 hover:bg-b-2 text-c-1 flex w-full items-center justify-center gap-2 rounded-b-lg border border-t-0 px-2 py-2 text-sm font-medium transition-colors"
          type="button"
          @click="showNestedSchema = true">
          {{ translate('schema.showSchemaDetails') }}
          <ScalarIconCaretDown class="h-3 w-3" />
        </button>

        <!-- Render the selected schema if it has content to display -->
        <Schema
          v-else
          :key="selectedOption?.id ?? '0'"
          :breadcrumb="breadcrumb"
          :compact="compact"
          :compositionPath="compositionPath"
          :cycleKey="selectedCompositionCycleKey"
          :discriminator="discriminator"
          :eventBus="eventBus"
          :hideHeading="hideHeading"
          :hideModelNames
          :level="level + 1"
          :name="name"
          :noncollapsible="true"
          :options="options"
          :schema="selectedComposition"
          :schemaContext="schemaContext" />
      </div>
    </template>
  </div>
</template>
