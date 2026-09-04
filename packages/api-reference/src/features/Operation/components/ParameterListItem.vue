<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import {
  ScalarMarkdown,
  ScalarMarkdownSummary,
} from '@scalar/components/markdown'
import { ScalarWrappingText } from '@scalar/components/wrapping-text'
import { ScalarIconCaretRight } from '@scalar/icons'
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
import { useSchemaLayout } from '@/components/Content/Schema/helpers/use-schema-layout'
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
    | 'schemaLayout'
    | 'schemaKeyboardNav'
  >
}>()

const emit = defineEmits<{
  (e: 'update:selectedContentType', value: string): void
}>()

const { isTreeLayout } = useSchemaLayout(() => options.schemaLayout)

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
 * over an empty panel. `seen` guards the `$ref` walk against self-referential
 * arrays (`Node.children: Node[]`), which are legal and would otherwise
 * overflow the stack.
 */
const hasChildElements = (
  input: unknown,
  seen = new Set<unknown>(),
): boolean => {
  if (!input || typeof input !== 'object' || seen.has(input)) {
    return false
  }
  seen.add(input)

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
 * Tree layout: a control may only hide child elements — media content,
 * response headers, or a schema with nested rows — never scalar detail, so a
 * scalar-only parameter renders statically. `truncated` stays as an overflow
 * escape hatch: it only turns true when a summary is cut off, and a summary
 * only renders on a disclosure. Legacy keeps its original predicate: any
 * schema makes the item collapsible.
 */
const shouldCollapse = computed<boolean>(() =>
  isTreeLayout.value
    ? Boolean(
        content.value ||
        headers.value ||
        hasChildElements(value.value) ||
        truncated.value,
      )
    : Boolean(
        content.value || headers.value || schema.value || truncated.value,
      ),
)

/**
 * Tree-only: a collapsable-list item with nothing to collapse renders like a
 * non-collapsable one — no trigger, a static panel, and the schema showing
 * its own name and description.
 */
const isStaticTreeItem = computed<boolean>(
  (): boolean =>
    Boolean(collapsableItems) && isTreeLayout.value && !shouldCollapse.value,
)

/**
 * Tree layout: a collapsible row's panel becomes a railed panel with the
 * DisclosurePanel as its root, so the disclosure wiring is untouched. Legacy
 * and static tree items keep the plain DisclosurePanel.
 */
const isRailedPanel = computed<boolean>(
  (): boolean =>
    isTreeLayout.value && Boolean(collapsableItems) && shouldCollapse.value,
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
 *
 * Tree only. The qualifier changes the anchor id, and the legacy layout's ids
 * must stay where they were.
 */
const headersBreadcrumb = computed<string[] | undefined>(() =>
  isTreeLayout.value && breadcrumb && name ? [...breadcrumb, name] : breadcrumb,
)

/**
 * Everything the response headers group needs except the headers themselves.
 * The group renders in two places — before the schema in the legacy layout,
 * after it in the tree layout — and the two differ only in position, so the
 * bindings live here instead of being written out twice. `headers` stays on
 * each element, where the `v-if` has already narrowed it to a real value.
 */
const headerGroupProps = computed(() => ({
  breadcrumb: headersBreadcrumb.value,
  document,
  eventBus,
  expandAllSchemaProperties: options.expandAllSchemaProperties,
  hideModels: options.hideModels,
  orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
  orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
  schemaKeyboardNav: options.schemaKeyboardNav,
  schemaLayout: options.schemaLayout,
}))

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
    class="parameter-item group/parameter-item"
    :class="{ 'parameter-item--tree border-t-0!': isTreeLayout }">
    <!-- Tree: no separators between rows; the section heading carries the one
         rule instead (see ParameterList / OperationResponses). -->
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
          <!-- Tree: the caret becomes the depth-0 gutter glyph so a response
               row reads as part of the schema tree below it. Anchored to the
               first line so the puck holds when the name wraps. -->
          <SchemaGlyphPuck
            v-if="shouldCollapse && isTreeLayout"
            anchor="line"
            class="parameter-item-glyph"
            :open="open" />
          <ScalarIconCaretRight
            v-else-if="shouldCollapse"
            class="parameter-item-icon size-3 transition-transform duration-100"
            :class="{ 'rotate-90': open }"
            weight="bold" />
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
      <!-- Railed in the tree: clicking the rail closes the row. The rail props
           only exist on SchemaRailPanel, so they bind only when it renders.
           The panel indents one gutter (restated here because the legacy
           padding reset outranks SchemaRailPanel's own utility) and the
           schema rows inside outdent by the same gutter, landing their pucks
           on the rail. See the indentation model in SchemaProperty.vue.
           No trailing-pad drop here: in this flat container every item is
           its container's only row, so the pad must stay or the next title
           crowds this item's description. -->
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
        <!-- Tree: the panel's own top margin already supplies the 6px gap to
             the title, so the legacy description margin is zeroed. -->
        <ScalarMarkdown
          v-if="collapsableItems && !isStaticTreeItem && parameter.description"
          class="parameter-item-description"
          :class="{ 'mt-0!': isRailedPanel }"
          :value="parameter.description" />
        <!-- Headers -->
        <!-- Status-qualified breadcrumb, or every response's header group
             would toggle as one. Legacy position: before the schema. -->
        <Headers
          v-if="headers && !isTreeLayout"
          v-bind="headerGroupProps"
          :headers="headers" />

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
            schemaLayout: options.schemaLayout,
            schemaKeyboardNav: options.schemaKeyboardNav,
            hideModels: options.hideModels,
            document,
          }"
          :required="'required' in parameter && parameter.required"
          :schema="value" />

        <!-- Tree order: the body reads first, directly under the status row,
             and Headers follows — opening Headers then appends its list at the
             end instead of pushing the body's description away from the title. -->
        <Headers
          v-if="headers && isTreeLayout"
          v-bind="headerGroupProps"
          :headers="headers" />
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

.parameter-item:last-of-type .parameter-schema {
  padding-bottom: 0;
}

.parameter-item-container {
  padding: 0;
}

.parameter-item-headers {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
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

.parameter-item-required-optional {
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  margin-right: 6px;
  position: relative;
}

.parameter-item--required {
  text-transform: uppercase;
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-orange);
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

.parameter-schema {
  padding-bottom: 9px;
  margin-top: 3px;
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

.parameter-item-icon {
  color: var(--scalar-color-3);
  left: -19px;
  top: 0.5lh;
  translate: 0 -50%;
  position: absolute;
}

.parameter-item-trigger:hover .parameter-item-icon,
.parameter-item-trigger:focus-visible .parameter-item-icon {
  color: var(--scalar-color-1);
}
</style>
