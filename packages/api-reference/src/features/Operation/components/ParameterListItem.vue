<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import {
  ScalarMarkdown,
  ScalarMarkdownSummary,
} from '@scalar/components/markdown'
import { ScalarWrappingText } from '@scalar/components/wrapping-text'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  ParameterObject,
  ResponseObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, watch } from 'vue'

import { getRefName } from '@/components/Content/Schema/helpers/get-ref-name'
import { hasComplexArrayItems } from '@/components/Content/Schema/helpers/has-complex-array-items'
import { optimizeValueForDisplay } from '@/components/Content/Schema/helpers/optimize-value-for-display'
import SchemaGlyphPuck from '@/components/Content/Schema/SchemaGlyphPuck.vue'
import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'
import SchemaRailPanel from '@/components/Content/Schema/SchemaRailPanel.vue'
import type { OperationProps } from '@/features/Operation/Operation.vue'
import { isOnScrollTargetPath } from '@/helpers/lazy-bus'

import ContentTypeSelect from './ContentTypeSelect.vue'
import Headers from './Headers.vue'
import { getParameterExamples } from './helpers/get-parameter-examples'

const {
  name,
  parameter,
  options,
  collapsableItems,
  breadcrumb,
  document,
  eventBus,
} = defineProps<{
  parameter: ParameterObject | ResponseObject
  name: string
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  collapsableItems?: boolean
  /** The document the operation belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  options: Pick<
    OperationProps['options'],
    | 'hideModels'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'schemaKeyboardNav'
  >
}>()

const emit = defineEmits<{
  (e: 'update:selectedContentType', value: string): void
}>()

/** Whether the markdown summary is being truncated */
const truncated = ref(false)

/** Responses and params may both have a schema */
const schema = computed<SchemaObject | null>(() =>
  'schema' in parameter && parameter.schema
    ? getResolvedRef(parameter.schema)
    : null,
)

/** Response and params may both have content */
const content = computed(() => {
  if (!('content' in parameter) || !parameter.content) {
    return null
  }
  const keys = Object.keys(parameter.content)
  if (keys.length === 0) {
    return null
  }
  return parameter.content
})

const selectedContentType = ref<string>(
  Object.keys(content.value || {})[0] ?? '',
)

/**
 * Report the selected content type upward so the example response panel can mirror it.
 * The parent decides whether the value is relevant (only response items are wired up),
 * so this item does not need to know whether it represents a response or a parameter.
 */
watch(selectedContentType, (type) => {
  emit('update:selectedContentType', type)
})

/** Response headers */
const headers = computed<ResponseObject['headers'] | null>(() =>
  'headers' in parameter && parameter.headers ? parameter.headers : null,
)

/** Raw schema (possibly with $ref) for the selected content type or param. */
const baseSchema = computed(() =>
  content.value
    ? content.value?.[selectedContentType.value]?.schema
    : 'schema' in parameter && parameter.schema
      ? parameter.schema
      : null,
)

/** When the schema is a $ref, preserve its name so the UI can show the ref name instead of just the type. */
const schemaModelName = computed(() => {
  const raw = baseSchema.value
  if (!raw) {
    return null
  }

  if ('$ref' in raw) {
    return getRefName(raw.$ref)
  }

  return null
})

/** Computed value from the combined schema param and content param */
const value = computed(() => {
  const base = baseSchema.value
  const resolvedBase = content.value ? getResolvedRef(base) : schema.value

  const deprecated =
    'deprecated' in parameter ? parameter.deprecated : schema.value?.deprecated

  /** Combine param/content/schema examples while ignoring undefined values. */
  const examples = getParameterExamples({
    parameter,
    schemaExamples: schema.value?.examples,
    contentExamples: content.value?.[selectedContentType.value]?.examples,
  })

  return {
    ...resolvedBase,
    deprecated: deprecated,
    examples,
  } as SchemaObject
})

/** Composition keywords that render their members as nested rows. */
const COMPOSITION_KEYWORDS = ['allOf', 'oneOf', 'anyOf', 'not'] as const

/**
 * Whether a resolved schema renders nested child rows — object members,
 * complex array items, or composition members. Scalar detail (format,
 * default, enum, examples) is information, not children.
 *
 * Must agree with what `SchemaProperty` renders: a mismatch either leaves a
 * subtree permanently expanded (children, no control) or draws a control
 * over an empty panel. Only the top-level schema is inspected — whether
 * children exist, not how deep they go, decides collapsibility — so there is no
 * `$ref` walk to recurse into and no cycle to guard against.
 */
const hasChildElements = (input: unknown): boolean => {
  if (!input || typeof input !== 'object') {
    return false
  }

  /* Judge the value the renderer draws: `optimizeValueForDisplay` erases
     single-member compositions and null unions, so the raw schema can report
     children for a composition that never renders one. */
  const schemaObject = (optimizeValueForDisplay(input as SchemaObject) ??
    input) as SchemaObject & Record<string, unknown>

  /* Mirror SchemaProperty's two-step gate: it opens an object block only when
     `properties` or `additionalProperties` is PRESENT (so
     `additionalProperties: false` still opens it), then renders whichever of
     properties / patternProperties / additionalProperties is TRUTHY. Testing
     only one step gets this wrong in both directions. */
  const rendersObjectBlock =
    'properties' in schemaObject || 'additionalProperties' in schemaObject

  if (
    rendersObjectBlock &&
    (schemaObject.properties ||
      schemaObject.patternProperties ||
      schemaObject.additionalProperties)
  ) {
    return true
  }

  if (
    COMPOSITION_KEYWORDS.some((keyword) => {
      const members = schemaObject[keyword]
      return Array.isArray(members) ? members.length > 0 : Boolean(members)
    })
  ) {
    return true
  }

  /* Arrays defer to the predicate SchemaProperty uses: `items: {$ref: …}`
     counts as complex there before the ref resolves, so a hand-rolled walk
     disagrees and leaves a ref-to-scalar items subtree permanently expanded. */
  if (hasComplexArrayItems(schemaObject)) {
    return true
  }

  return false
}

/**
 * Whether this item renders as a collapsible disclosure.
 *
 * A control may only hide child elements — media content, response headers,
 * or a schema with nested rows — never scalar detail, so a scalar-only
 * parameter renders statically. `truncated` stays as an overflow escape
 * hatch: it only turns true when a summary is cut off, and a summary only
 * renders on a disclosure.
 */
const shouldCollapse = computed<boolean>(() =>
  Boolean(
    content.value ||
    headers.value ||
    hasChildElements(value.value) ||
    truncated.value,
  ),
)

/**
 * A collapsable-list item with nothing to collapse renders like a
 * non-collapsable one — no trigger, a static panel, and the schema showing
 * its own name and description.
 */
const isStaticTreeItem = computed<boolean>(
  (): boolean => Boolean(collapsableItems) && !shouldCollapse.value,
)

/**
 * A collapsible row's panel becomes a railed panel with the DisclosurePanel
 * as its root, so the disclosure wiring is untouched. Non-collapsable and
 * static items keep the plain DisclosurePanel.
 */
const isRailedPanel = computed<boolean>(
  (): boolean => Boolean(collapsableItems) && shouldCollapse.value,
)

/**
 * The breadcrumb passed to the schema. Collapsible items (responses) render their
 * schema without a name to avoid a duplicate heading, so we push the item name
 * (e.g. the status code) onto the breadcrumb here to keep property anchors unique.
 */
const schemaBreadcrumb = computed<string[] | undefined>(() =>
  collapsableItems && !isStaticTreeItem.value && breadcrumb && name
    ? [...breadcrumb, name]
    : breadcrumb,
)

/**
 * The breadcrumb for this item's response headers, qualified by status code:
 * `OperationResponses` hands every status the same `[...breadcrumb,
 * 'responses']`, so keying headers off that alone makes all responses share
 * one expansion node (opening 200's headers opens 404's too).
 */
const headersBreadcrumb = computed<string[] | undefined>(() =>
  breadcrumb && name ? [...breadcrumb, name] : breadcrumb,
)

/**
 * Whether a deep link points at a property inside this collapsed item. When it
 * does, the disclosure opens on mount so a fresh navigation can render the target
 * and scroll it into view (mirrors how collapsible schema disclosures behave).
 */
const isOnTargetPath = computed<boolean>(() =>
  isOnScrollTargetPath(schemaBreadcrumb.value?.join('.')),
)

/**
 * The anchor id for a collapsible item's own row. The schema renders without
 * a name (to avoid a duplicate heading), and the name is what makes
 * `SchemaProperty` mount the `WithBreadcrumb` anchor — so the trigger carries
 * the id deep links point at. The copy-link button cannot move here with it:
 * a button may not contain another button.
 */
const triggerAnchorId = computed<string | undefined>(() =>
  collapsableItems && !isStaticTreeItem.value
    ? schemaBreadcrumb.value?.join('.')
    : undefined,
)
</script>
<template>
  <li
    class="parameter-item group/parameter-item parameter-item--tree border-t-0!">
    <!-- No separators between rows (the row zeroes its own top border); the
         section heading carries the one rule instead (see ParameterList /
         OperationResponses). -->
    <Disclosure
      v-slot="{ open, close }"
      :defaultOpen="isOnTargetPath">
      <!-- The trigger spans the full row, so its focus ring must too: drawing
           it on the 12px caret leaves the actual control with no visible
           focus state. -->
      <component
        :is="shouldCollapse ? DisclosureButton : 'div'"
        v-if="collapsableItems && !isStaticTreeItem"
        :id="triggerAnchorId"
        class="parameter-item-trigger group/trigger group/tree-control scroll-mt-24 focus-visible:rounded-(--scalar-radius) focus-visible:outline-(length:--scalar-border-width) focus-visible:outline-offset-2 focus-visible:outline-(--scalar-color-accent)"
        :class="{ 'parameter-item-trigger-open': open }">
        <div class="parameter-item-name min-w-0">
          <!-- The puck is the depth-0 gutter glyph, so a response row reads as
               part of the schema tree below it. Anchored to the first line so
               it holds when the name wraps. -->
          <SchemaGlyphPuck
            v-if="shouldCollapse"
            anchor="line"
            class="parameter-item-glyph"
            :open="open" />
          <div>
            <ScalarWrappingText
              preset="property"
              :text="name" />
          </div>
        </div>
        <ScalarMarkdownSummary
          v-if="!open && parameter.description"
          v-model:truncated="truncated"
          class="parameter-item-description-summary min-w-0 flex-1"
          controlled
          :value="parameter.description" />
        <div
          v-else
          class="flex-1" />
      </component>
      <!-- Railed when collapsible: clicking the rail closes the row. The rail
           props only exist on SchemaRailPanel, so they bind only when it
           renders. The panel indents one gutter (restated here because the
           scoped `.parameter-item-container` padding reset outranks
           SchemaRailPanel's own utility) and the schema rows inside outdent
           by the same gutter, landing their pucks on the rail. See the
           indentation model in SchemaProperty.vue. No trailing-pad drop here:
           in this flat container every item is its container's only row, so
           the pad must stay or the next title crowds this item's
           description. -->
      <component
        :is="isRailedPanel ? SchemaRailPanel : DisclosurePanel"
        v-bind="
          isRailedPanel
            ? {
                as: DisclosurePanel,
                depth: 1,
                closeOnRail: true,
                onClose: close,
              }
            : {}
        "
        class="parameter-item-container parameter-item-container-markdown"
        :class="{
          'parameter-item-container--tree mt-1.5 mb-0.5 ps-[var(--schema-gutter,16px)]!':
            isRailedPanel,
          'parameter-item-container--static-tree': isStaticTreeItem,
        }"
        :static="!collapsableItems || isStaticTreeItem">
        <!-- The railed panel's own top margin already supplies the 6px gap to
             the title, so the description's default margin is zeroed. -->
        <ScalarMarkdown
          v-if="collapsableItems && !isStaticTreeItem && parameter.description"
          class="parameter-item-description"
          :class="{ 'mt-0!': isRailedPanel }"
          :value="parameter.description" />

        <!-- Schema -->
        <SchemaProperty
          is="div"
          :breadcrumb="schemaBreadcrumb"
          compact
          :description="
            collapsableItems && !isStaticTreeItem ? '' : parameter.description
          "
          :eventBus="eventBus"
          :hideWriteOnly="true"
          :modelName="schemaModelName"
          :name="collapsableItems && !isStaticTreeItem ? '' : name"
          :noncollapsible="true"
          :options="{
            hideWriteOnly: true,
            orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
            orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
            expandAllSchemaProperties: options.expandAllSchemaProperties,
            schemaKeyboardNav: options.schemaKeyboardNav,
            hideModels: options.hideModels,
            document,
          }"
          :required="'required' in parameter && parameter.required"
          :schema="value" />

        <!-- Headers: the body reads first, directly under the status row, and
             Headers follows — opening Headers then appends its list at the
             end instead of pushing the body's description away from the
             title. The breadcrumb is status-qualified, or every response's
             header group would toggle as one. -->
        <Headers
          v-if="headers"
          :breadcrumb="headersBreadcrumb"
          :document="document"
          :eventBus="eventBus"
          :expandAllSchemaProperties="options.expandAllSchemaProperties"
          :headers="headers"
          :hideModels="options.hideModels"
          :orderRequiredPropertiesFirst="options.orderRequiredPropertiesFirst"
          :orderSchemaPropertiesBy="options.orderSchemaPropertiesBy"
          :schemaKeyboardNav="options.schemaKeyboardNav" />
      </component>
      <div
        v-if="shouldCollapse && content"
        class="absolute top-[calc(10px+0.5lh)] right-0 z-0 flex -translate-y-1/2 items-center text-base"
        :class="{
          'opacity-0 group-focus-within/parameter-item:opacity-100 group-hover/parameter-item:opacity-100':
            !open,
        }">
        <div
          class="from-b-1 absolute inset-y-0 -left-6 -z-1 w-8 bg-linear-to-l from-40% to-transparent" />
        <ContentTypeSelect
          v-model="selectedContentType"
          :content="content" />
      </div>
    </Disclosure>
  </li>
</template>

<style scoped>
.parameter-item {
  display: flex;
  flex-direction: column;
  position: relative;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}

.parameter-item-container {
  padding: 0;
}

.parameter-item-name {
  position: relative;
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-font-size-4);
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
  overflow-wrap: break-word;
}

.parameter-item-description,
.parameter-item-description-summary {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
}

.parameter-item-description-summary.parameter-item-description-summary > * {
  --markdown-line-height: var(--scalar-line-height-5);
}

/* Match font size of markdown for property-detail-value since first child within accordian is displayed as if it were in the markdown section */
.parameter-item-trigger
  ~ .parameter-item-container
  :deep(.property--level-0 > .property-heading .property-detail-value) {
  font-size: var(--scalar-micro);
}

.parameter-item-description {
  margin-top: 6px;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
  line-height: 1.4;
}

.parameter-item-description :deep(p) {
  margin-top: 4px;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
}

.parameter-item-trigger {
  display: flex;
  align-items: baseline;
  line-height: var(--scalar-line-height-5);
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 0;
}

.parameter-item-trigger-open {
  padding-bottom: 0;
}
</style>
