<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarWrappingText } from '@scalar/components/wrapping-text'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  isDynamicRef,
  resolveDynamicRef,
} from '@scalar/workspace-store/helpers/dynamic-ref'
import { resolve } from '@scalar/workspace-store/resolve'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import {
  computed,
  inject,
  onScopeDispose,
  ref,
  useId,
  useTemplateRef,
  watch,
  type Component,
} from 'vue'

import { CopyLinkButton, WithBreadcrumb } from '@/components/Anchor'
import {
  resolveDynamicSchema,
  useDynamicScope,
} from '@/components/Content/Schema/helpers/dynamic-scope'
import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'
import {
  getCycleKey,
  SCHEMA_ANCESTORS_SYMBOL,
} from '@/components/Content/Schema/helpers/schema-cycle'
import {
  toNodeKey,
  useSchemaExpansion,
} from '@/components/Content/Schema/helpers/schema-expansion'
import type { SchemaOptions } from '@/components/Content/Schema/types'
import { useLocalization } from '@/features/localization'
import { SpecificationExtension } from '@/features/specification-extension'

import { getCompositionsToRender } from './helpers/get-compositions-to-render'
import { getEnumValues } from './helpers/get-enum-values'
import { getPropertyDescription } from './helpers/get-property-description'
import { getRefName } from './helpers/get-ref-name'
import { typeSignatureInlinesEnum } from './helpers/get-type-signature-tokens'
import { hasComplexArrayItems } from './helpers/has-complex-array-items'
import { optimizeValueForDisplay } from './helpers/optimize-value-for-display'
import type { CompositionKeyword } from './helpers/schema-composition'
import { shouldDisplayDescription } from './helpers/should-display-description'
import { shouldDisplayHeading } from './helpers/should-display-heading'
import { sortPropertyNames } from './helpers/sort-property-names'
import { useSchemaLayout } from './helpers/use-schema-layout'
import Schema from './Schema.vue'
import SchemaCollapsedPreview from './SchemaCollapsedPreview.vue'
import SchemaComposition from './SchemaComposition.vue'
import SchemaEnums from './SchemaEnums.vue'
import SchemaGutterToggle from './SchemaGutterToggle.vue'
import SchemaPropertyHeading from './SchemaPropertyHeading.vue'
import SchemaRailPanel from './SchemaRailPanel.vue'

/**
 * Note: We're taking in a prop called `value` which should be a JSON Schema.
 *
 * We're using `optimizeValueForDisplay` to merge null types in compositions (anyOf, allOf, oneOf, not).
 * So you should basically use the optimizedValue everywhere in the component.
 */

/** Composition keywords that hold a list of schemas and can be flattened when they contain a single member. */
const SINGLE_ITEM_COMPOSITIONS = ['oneOf', 'anyOf', 'allOf'] as const

const props = withDefaults(
  defineProps<{
    is?: string | Component
    schema: SchemaObject | undefined
    noncollapsible?: boolean
    level?: number
    /**
     * Real nesting depth in the tree layout. Its own counter because `level`
     * advances by a different stride per edge (object +2, composition +1).
     */
    depth?: number
    name?: string
    required?: boolean
    compact?: boolean
    discriminator?: DiscriminatorObject
    description?: string
    hideModelNames?: boolean
    hideHeading?: boolean
    /** When the root schema was resolved from a $ref, pass the ref name for display (e.g. "Data"). */
    modelName?: string | null
    variant?: 'additionalProperties' | 'patternProperties'
    breadcrumb?: string[]
    eventBus: WorkspaceEventBus | null
    options: SchemaOptions
    /** Enum values for property names (from JSON Schema propertyNames keyword). */
    propertyNamesEnum?: string[]
    /** Resolved propertyNames schema, used to show key constraints like `format`. */
    propertyNamesSchema?: SchemaObject
    /** When "requestBody", composition selection is synced with the example snippet */
    schemaContext?: string
    /** Internal path used to sync nested request body compositions with the code sample */
    compositionPath?: string[]
    /** Internal path segment for this property when building nested composition keys */
    compositionPathSegment?: string
    /** Stable identity of this property's schema, used for cycle detection. */
    cycleKey?: unknown
  }>(),
  {
    level: 0,
    depth: 0,
    required: false,
    compact: false,
    hideModelNames: false,
  },
)

/** The dynamic scope inherited from the enclosing schema resources, used to bind `$dynamicRef`s. */
const dynamicScope = useDynamicScope()

/**
 * Simplified composition with `null` type.
 *
 * A top-level `$dynamicRef` (e.g. a linked-list `next` node) is bound to its concrete type via the
 * dynamic scope first; for ordinary schemas this is a no-op.
 */
const optimizedValue = computed(() =>
  optimizeValueForDisplay(resolveDynamicSchema(props.schema, dynamicScope)),
)

const childBreadcrumb = computed<string[] | undefined>(() =>
  props.breadcrumb
    ? // A named property extends the breadcrumb with its own name. A nameless
      // container (e.g. a response object, rendered without a name to avoid a
      // duplicate heading) passes its breadcrumb straight through so its
      // properties stay linkable.
      props.name
      ? [...props.breadcrumb, props.name]
      : props.breadcrumb
    : undefined,
)

const currentCompositionPath = computed<string[]>(() =>
  props.compositionPathSegment
    ? [...(props.compositionPath ?? []), props.compositionPathSegment]
    : (props.compositionPath ?? []),
)

const arrayItemsCompositionPath = computed<string[]>(() => [
  ...currentCompositionPath.value,
  'items',
])

const shouldHaveLink = computed(() => props.level <= 2)

/**
 * The array schema used for item inspection, with a `$dynamicRef` item bound to its concrete type.
 *
 * Returns the schema unchanged unless `items` is a `$dynamicRef` that resolves against the dynamic
 * scope, so ordinary arrays (including `$ref` items) keep their existing behavior exactly.
 */
const arrayValueWithBoundItems = computed(() => {
  const value = optimizedValue.value
  if (!value || !isArraySchema(value) || !isDynamicRef(value.items)) {
    return value
  }

  const bound = resolveDynamicRef(value.items.$dynamicRef, dynamicScope)
  return bound ? ({ ...value, items: bound } as SchemaObject) : value
})

/** Checks if array items have complex structure */
const hasComplexArrayItemsComputed = computed(() =>
  hasComplexArrayItems(arrayValueWithBoundItems.value),
)

/** Check if enum should be displayed (from value schema or from propertyNames) */
const hasEnum = computed(() => enumValues.value.length > 0)

/** Determine if object properties should be displayed */
const shouldRenderObjectProperties = computed(() => {
  const value = optimizedValue.value
  if (!value) {
    return false
  }

  if (!('properties' in value || 'additionalProperties' in value)) {
    return false
  }

  // `allOf` already merges the factored-out sibling `properties` into its
  // rendered result (see `mergeAllOfSchemas`), so rendering a separate object
  // block here would show those properties twice. Let the composition handle it.
  if ('allOf' in value) {
    return false
  }

  // A schema may factor its common `properties` out to the top level alongside
  // a composition keyword (anyOf/oneOf/not), as described in the JSON Schema
  // "factoring schemas" guide. `isTypeObject` deliberately rejects such schemas
  // so the composition is rendered, but the factored-out properties must still
  // show. Unlike `allOf`, these compositions do not merge sibling properties.
  // Render them unless the schema is an explicit non-object (scalar or array)
  // type. See https://github.com/scalar/scalar/issues/8593
  const type = (value as { type?: unknown }).type
  const isExplicitNonObject = typeof type === 'string' && type !== 'object'

  return isTypeObject(value) || !isExplicitNonObject
})

/** Determine if array of objects should be rendered */
const shouldRenderArrayOfObjects = computed(() => {
  const value = optimizedValue.value
  if (!value || !isArraySchema(value) || typeof value.items !== 'object') {
    return false
  }

  return hasComplexArrayItemsComputed.value
})

/** Extract enum values from schema or array items */
const enumValues = computed(() => getEnumValues(optimizedValue.value))

/** Generate property description from type/format */
const propertyDescription = computed(() =>
  getPropertyDescription(optimizedValue.value),
)

/** Determine if description should be displayed */
const displayDescription = computed(() =>
  shouldDisplayDescription(optimizedValue.value, props.description),
)

/**
 * The schema used to render the object's own properties.
 *
 * Composition keywords are stripped so the nested object renders only its
 * properties. The compositions are rendered separately below; leaving them here
 * would route the nested `Schema` back through `SchemaProperty` and recurse.
 *
 * The `discriminator` is stripped too: its variant selector is part of the
 * composition rendered below (including the one inferred from a bare
 * `discriminator.mapping`), so keeping it here would make the nested `Schema`
 * infer and render a second, identical selector.
 *
 * When the property already renders the description, we also drop it to avoid
 * repeating it in the nested object schema card.
 */
const objectSchemaForChildren = computed(() => {
  const value = optimizedValue.value
  if (!value) {
    return value
  }

  const {
    oneOf: _oneOf,
    anyOf: _anyOf,
    allOf: _allOf,
    not: _not,
    discriminator: _discriminator,
    ...objectSchema
  } = value as Record<string, unknown>

  if (displayDescription.value && 'description' in objectSchema) {
    const { description: _description, ...schemaWithoutDescription } =
      objectSchema
    return schemaWithoutDescription as SchemaObject
  }

  return objectSchema as SchemaObject
})

/** Determine if property heading should be displayed */
const shouldDisplayHeadingComputed = computed(() =>
  shouldDisplayHeading(optimizedValue.value, props.name, props.required),
)

/** Computes which compositions should be rendered and with which values */
const compositionsToRender = computed(() =>
  getCompositionsToRender(optimizedValue.value, props.options.document),
)
const getCompositionDiscriminator = (
  composition: CompositionKeyword,
): DiscriminatorObject | undefined =>
  composition === 'allOf'
    ? (props.schema?.discriminator ?? props.discriminator)
    : props.schema?.discriminator

/**
 * Get resolved array items for rendering (with any `$dynamicRef` bound to the concrete type).
 *
 * When the items are wrapped in a single-item composition (e.g. `items: { allOf: [{ type: 'object', ... }] }`), we
 * flatten that wrapper into its plain form. A composition with a single member is equivalent to that member, so
 * keeping the composition keyword only makes the items render through an extra schema layer, which adds an
 * unnecessary level of nesting and duplicates the item description. See https://github.com/scalar/scalar/issues/5900
 */
const resolvedArrayItems = computed(() => {
  const value = arrayValueWithBoundItems.value
  if (!value || !isArraySchema(value) || typeof value.items !== 'object') {
    return undefined
  }

  const items = resolve.schema(value.items)
  const hasSingleItemComposition = SINGLE_ITEM_COMPOSITIONS.some(
    (keyword) =>
      Array.isArray(items?.[keyword]) && items[keyword]?.length === 1,
  )

  return hasSingleItemComposition ? optimizeValueForDisplay(items) : items
})

/**
 * Cycle key for the array items schema, derived from the raw (unresolved) items
 * so a self-referential array element is detected as a cycle.
 */
const arrayItemsCycleKey = computed(() => {
  const value = optimizedValue.value
  if (!value || !isArraySchema(value)) {
    return undefined
  }
  return getCycleKey(value.items)
})

/** Check if discriminator matches current property */
const isDiscriminatorProperty = computed(() =>
  Boolean(props.name && props.discriminator?.propertyName === props.name),
)

// ---------------------------------------------------------------------------
// Tree layout: the disclosure belongs to the property row itself — a gutter
// control on this <li>, a rail down its children, and the child Schema
// rendered flat (noncollapsible) inside the panel.
// ---------------------------------------------------------------------------

/*
 * THE INDENTATION MODEL. Read this before touching any offset.
 *
 * A row NEVER indents itself: it is a single-column grid, so its text starts
 * where its container puts it. Indentation is created in ONE place —
 * SchemaRailPanel (.property-children) pads its children by one gutter.
 * Floating controls hang in the margin at fixed offsets (the 24px toggle at
 * -28px, an 18px puck at -25px), both centred 16px left of the text: the
 * parent's rail line inside a panel, the open margin at the root. Never
 * reserve a gutter column per row and cancel it elsewhere; each cancellation
 * is one refactor away from re-indenting the first level.
 *
 * Every tree style is a utility in the template. The semantic classes
 * (`property--tree`, `property-children`, ...) stay as hooks for consumers.
 */

const { translate } = useLocalization()

const { isTreeLayout } = useSchemaLayout(() => props.options.schemaLayout)

/** Whether this property has children the tree layout should put behind a toggle. */
const isExpandable = computed(
  (): boolean =>
    shouldRenderObjectProperties.value || shouldRenderArrayOfObjects.value,
)

/**
 * Whether this property loops back onto an ancestor schema. The tree layout
 * renders a cycle as a leaf row whose signature line says `recursive`.
 */
const ancestors = inject(SCHEMA_ANCESTORS_SYMBOL, undefined)

const treeCycleKey = computed(() =>
  shouldRenderArrayOfObjects.value ? arrayItemsCycleKey.value : props.cycleKey,
)

const isCyclicProperty = computed(
  (): boolean =>
    treeCycleKey.value != null && !!ancestors?.has(treeCycleKey.value),
)

/**
 * The schema the cycle returns to, which is what the row names. The cycle key
 * for a `$ref` node is the ref string, so the model name falls out of it;
 * naming this row instead would describe the wrong end of the loop.
 */
const cycleTargetName = computed((): string => {
  const key = treeCycleKey.value

  if (typeof key === 'string') {
    const refName = getRefName(key)

    if (refName) {
      return refName
    }
  }

  return props.modelName || props.name || translate('schema.schema')
})

const expansion = useSchemaExpansion()

/** See Schema.vue — surfaces without breadcrumbs keep per-instance state. */
const anonymousTreeKey = useId()

/**
 * This row's identity in the expansion store: deliberately the plain anchor
 * path, identical to the string the row's own anchor uses, so `commitPath`
 * can open it for a deep link. A structural marker would not be a prefix of
 * any anchor, and bridging that gap (an alias registry, an anchorPath hint)
 * expanded unrelated siblings and clobbered the reader's explicit collapse.
 */
const treeNodeKey = computed(
  (): string =>
    toNodeKey(childBreadcrumb.value) || `~anonymous-${anonymousTreeKey}`,
)

/**
 * Whether this property renders as a collapsible tree row. A nameless container
 * has no heading to hang a control on, so it renders its children directly.
 */
const isTreeRow = computed(
  (): boolean =>
    isTreeLayout.value &&
    isExpandable.value &&
    !props.noncollapsible &&
    shouldDisplayHeadingComputed.value &&
    !isCyclicProperty.value,
)

const isTreeOpen = computed(
  (): boolean =>
    isTreeRow.value &&
    expansion.isExpanded(treeNodeKey.value, {
      cyclic: isCyclicProperty.value,
      defaultOpen: !!props.options.expandAllSchemaProperties,
    }),
)

/**
 * Mount policy, three states. Never opened: not rendered, which is the render
 * guard that stops a `$ref` cycle from recursing. Open: rendered. Opened then
 * closed: kept under `hidden="until-found"` so find-in-page can reach it,
 * capped tree-wide so hundreds of closed rows do not pile up as hidden DOM.
 * Past the cap, and in Safari where `until-found` is inert, closed panels unmount.
 */
const keepClosedPanelMounted = ref(false)

watch(isTreeOpen, (open, wasOpen) => {
  if (open) {
    if (keepClosedPanelMounted.value) {
      expansion.untilFound.release()
      keepClosedPanelMounted.value = false
    }
    return
  }

  if (wasOpen) {
    keepClosedPanelMounted.value =
      supportsUntilFound() && expansion.untilFound.acquire()
  }
})

/*
 * A row can leave the tree while still holding a slot (a composition picker
 * remounts its subtree on every variant change), and a leaked slot drains the
 * shared budget until find-in-page retention fails silently page-wide.
 */
onScopeDispose(() => {
  if (keepClosedPanelMounted.value) {
    expansion.untilFound.release()
    keepClosedPanelMounted.value = false
  }
})

/** `hidden="until-found"` support — Safari is the lone engine without it. */
const supportsUntilFound = (): boolean =>
  typeof document !== 'undefined' && 'onbeforematch' in document.body

const isTreePanelRendered = computed(
  (): boolean => isTreeOpen.value || keepClosedPanelMounted.value,
)

const treePanelId = useId()
const treeNameId = useId()
const treeCountId = useId()

/** The rail panel is a component, so the DOM node is reached through `$el`. */
const treePanelRef = useTemplateRef<{ $el: HTMLElement }>('treePanel')
const treeToggleRef = useTemplateRef<{ $el: HTMLElement } | HTMLElement>(
  'treeToggle',
)

/**
 * The filtered, ordered child property names, computed once per row because
 * `sortPropertyNames` (sort plus `$ref` resolution of every child) is the
 * hottest per-row cost and both the count label and the preview need it. Same
 * call the panel makes — full options, no discriminator — or the preview names
 * the wrong first rows and the count disagrees with the panel.
 */
const sortedChildPropertyNames = computed((): string[] => {
  const source = shouldRenderArrayOfObjects.value
    ? resolvedArrayItems.value
    : objectSchemaForChildren.value

  return source ? sortPropertyNames(source, undefined, props.options) : []
})

/**
 * The child count that rides the toggle's `aria-describedby`. A description
 * rather than part of the name, so screen-reader verbosity settings apply.
 */
const treeChildCountLabel = computed((): string | null => {
  if (!isExpandable.value) {
    return null
  }

  // Count the rows the panel will actually render: hideReadOnly / hideWriteOnly
  // filter the list, so raw keys would announce children that do not exist.
  const source = shouldRenderArrayOfObjects.value
    ? resolvedArrayItems.value
    : objectSchemaForChildren.value
  if (!source) {
    return null
  }

  // Three groups, not one: properties, patternProperties and additionalProperties,
  // or a map-only schema announces no children at all.
  const named = sortedChildPropertyNames.value.length
  const patterns =
    'patternProperties' in source && source.patternProperties
      ? Object.keys(source.patternProperties).length
      : 0
  const additional =
    'additionalProperties' in source && source.additionalProperties ? 1 : 0
  const count = named + patterns + additional

  if (count === 0) {
    return null
  }

  return translate('schema.propertyCount', { count: String(count) })
})

/**
 * Whether the type signature will render this row's enum values inline, which
 * is the only case where suppressing the separate value list is safe.
 */
const signatureInlinesEnum = computed((): boolean =>
  typeSignatureInlinesEnum(optimizedValue.value, {
    hideModelNames: props.hideModelNames,
  }),
)

/**
 * The toggle's accessible name when the row has no visible property name (an
 * array-of-objects root, say), so it is never announced as an unnamed button.
 */
const treeFallbackLabel = computed(
  (): string => props.modelName || translate('schema.schema'),
)

const toggleTree = (): void => {
  const next = !isTreeOpen.value

  // Same rule as the legacy toggle: collapsing a subtree that holds focus moves
  // focus up to this row's control instead of dropping it to <body>.
  if (!next) {
    const active = document.activeElement
    const toggleElement =
      treeToggleRef.value instanceof HTMLElement
        ? treeToggleRef.value
        : treeToggleRef.value?.$el

    if (active && treePanelRef.value?.$el.contains(active)) {
      toggleElement?.focus()
    }
  }

  expansion.setExpanded(treeNodeKey.value, next)
}

/**
 * The whole heading is a pointer convenience for the disclosure; the gutter
 * toggle stays the accessible control. Interactive children keep their own
 * clicks, and a click that ends a text selection selects rather than toggles,
 * so property names stay copyable.
 */
const onHeadingClick = (event: MouseEvent): void => {
  if (!isTreeRow.value) {
    return
  }

  const target = event.target

  if (
    target instanceof Element &&
    target.closest('a, button, [role="button"], input, select, label')
  ) {
    return
  }

  if (window.getSelection()?.toString()) {
    return
  }

  toggleTree()
}

/** Reopen a panel the browser revealed through find-in-page. */
const onBeforeMatch = (): void => {
  expansion.setExpanded(treeNodeKey.value, true)
}
</script>
<template>
  <component
    :is="is ?? 'li'"
    class="property"
    :class="[
      `property--level-${level}`,
      {
        'property--compact': compact,
        'property--deprecated': optimizedValue?.deprecated,
        /*
         * A single-column grid that never indents itself (see the indentation
         * model in the script). The tree spaces rows from --schema-row-pad and
         * separates them by rail, so the legacy padding and row border go.
         */
        'property--tree grid! grid-cols-[minmax(0,1fr)] border-b-0! px-0! py-[var(--schema-row-pad,6px)]!':
          isTreeLayout,
        'property--tree-container':
          isTreeLayout &&
          !isTreeRow &&
          !isCyclicProperty &&
          (isExpandable || !shouldDisplayHeadingComputed),
      },
      isTreeLayout ? `property--depth-${depth}` : undefined,
    ]">
    <!-- Tree layout: the disclosure control in this row's own gutter. See
         SchemaGutterToggle for the accessible-name wiring. -->
    <!-- Absolutely positioned so the 24px hit box never sizes the heading row;
         the offset centres the puck on the rail line, and z-1 beats the rail
         strip so the puck wins the pointer. -->
    <SchemaGutterToggle
      v-if="isTreeRow"
      ref="treeToggle"
      class="absolute start-[calc(-12px_-_var(--schema-gutter,16px))] -top-0.5 z-[1] col-start-1 row-start-1 print:hidden"
      :countId="treeChildCountLabel ? treeCountId : undefined"
      :fallbackLabel="treeFallbackLabel"
      :nameId="name ? treeNameId : undefined"
      :open="isTreeOpen"
      :panelId="treePanelId"
      :panelRendered="isTreePanelRendered"
      @toggle="toggleTree" />
    <!-- Tree layout: `row-start-1` shares the toggle's row. Whatever precedes
         the trailing hash drops its own right margin, so the hash sits the
         same distance after the text whether or not the row shows a preview
         (the preview carries no margin of its own — see below). -->
    <SchemaPropertyHeading
      v-if="shouldDisplayHeadingComputed"
      class="group"
      :class="{
        'cursor-pointer': isTreeRow,
        'relative row-start-1 min-h-5 content-center [&>*:has(+.copy-link-trailing)]:me-0!':
          isTreeLayout,
      }"
      @click="onHeadingClick"
      :enum="hasEnum"
      :eventBus="eventBus"
      :hideModelNames
      :isDiscriminator="isDiscriminatorProperty"
      :modelLinkOptions="{
        hideModels: options.hideModels,
        document: options.document,
      }"
      :modelName="modelName"
      :propertyNames="propertyNamesSchema"
      :recursiveTo="isCyclicProperty ? cycleTargetName : undefined"
      :required
      :typeSignature="isTreeLayout"
      :keyKind="
        variant === 'additionalProperties'
          ? 'additional'
          : variant === 'patternProperties'
            ? 'pattern'
            : undefined
      "
      :value="optimizedValue">
      <template
        v-if="name"
        #name>
        <WithBreadcrumb
          :breadcrumb="shouldHaveLink ? childBreadcrumb : undefined"
          :eventBus="eventBus"
          :placement="isTreeLayout ? 'trailing' : 'leading'">
          <!-- The ONLY node the gutter toggle's aria-labelledby points at -->
          <span
            :id="isTreeLayout ? treeNameId : undefined"
            class="contents">
            <!-- Tree layout: the map-key keyword lives in the signature line
                 (see SchemaPropertyHeading), so the legacy chip chrome on the
                 name — dashed box, accent colour, the `regex` badge — is
                 switched off here and the name reads like any other. The
                 class names stay as styling hooks. -->
            <span
              v-if="variant === 'patternProperties'"
              class="property-name-pattern-properties"
              :class="{
                'text-c-1! border-0! p-0! before:hidden!': isTreeLayout,
              }">
              <ScalarWrappingText
                preset="property"
                :text="name" />
            </span>
            <span
              v-else-if="variant === 'additionalProperties'"
              class="property-name-additional-properties"
              :class="{
                'text-c-1! border-0! p-0! before:hidden!': isTreeLayout,
              }">
              <ScalarWrappingText
                preset="property"
                :text="name" />
            </span>
            <ScalarWrappingText
              v-else
              preset="property"
              :text="name" />
          </span>
        </WithBreadcrumb>
      </template>
      <template
        v-if="optimizedValue?.example !== undefined"
        #example>
        Example:
        {{ optimizedValue.example }}
      </template>
      <template
        v-if="isTreeRow && !isTreeOpen"
        #preview>
        <!-- Purely visual: the child count already rides aria-describedby -->
        <!-- A zero-basis flex item must have a zero outer size, or the heading's
             9px child margin wraps it onto its own line -->
        <SchemaCollapsedPreview
          aria-hidden="true"
          class="mr-0!"
          :propertyNames="sortedChildPropertyNames"
          :schema="
            shouldRenderArrayOfObjects
              ? (resolvedArrayItems as SchemaObject)
              : (objectSchemaForChildren as SchemaObject)
          " />
      </template>
      <template
        v-if="isTreeLayout && name && shouldHaveLink && childBreadcrumb"
        #trailing>
        <CopyLinkButton
          :anchorId="childBreadcrumb.join('.')"
          :eventBus="eventBus" />
      </template>
    </SchemaPropertyHeading>

    <!-- Description -->
    <!-- Tree layout: the heading's 20px slot already leaves slack under the
         name, so 4px lands the description at the legacy 6px's visual
         distance; 6px above a composition keeps the row on the 12px rhythm. -->
    <div
      v-if="displayDescription || propertyDescription"
      class="property-description"
      :class="{ 'mt-1! has-[+.property-rule]:mb-1.5!': isTreeLayout }">
      <ScalarMarkdown
        :value="displayDescription || propertyDescription || ''" />
    </div>

    <!-- Enum for property names -->
    <SchemaEnums
      v-if="propertyNamesEnum && propertyNamesEnum.length > 0"
      propertyNames
      :value="{ enum: propertyNamesEnum } as SchemaObject" />

    <!-- Enum values -->
    <!-- The array items card rendered below already lists these same values. -->
    <!-- Tree layout: skip the list when the signature already inlines the enum,
         but only when it genuinely does (never for a $ref or an untyped schema),
         or the values would be shown nowhere at all. -->
    <SchemaEnums
      v-if="
        enumValues.length > 0 &&
        !shouldRenderArrayOfObjects &&
        !(isTreeLayout && signatureInlinesEnum)
      "
      :layout="isTreeLayout ? 'tree' : 'legacy'"
      :value="optimizedValue" />

    <!-- Tree layout: the child count description and the rail panel -->
    <template v-if="isTreeLayout">
      <span
        v-if="isTreeRow && treeChildCountLabel"
        :id="treeCountId"
        class="screenreader-only"
        >{{ treeChildCountLabel }}</span
      >

      <!-- closeOnRail: a pointer-only convenience like an editor's indent
           guide; the gutter toggle stays the accessible control. -->
      <!-- Nothing inside a panel may add trailing height below the last row,
           so the descendant resets reach into the child Schema cards. -->
      <SchemaRailPanel
        v-if="isTreeRow && isTreePanelRendered"
        :id="treePanelId"
        ref="treePanel"
        class="property-children mt-1.5 mb-0.5 [&_.schema-card]:mb-0! [&_.schema-card]:pb-0! [&_.schema-properties]:mb-0! [&_.schema-properties]:pb-0! [&_ul]:my-0! [&_ul]:py-0! [&[hidden=until-found]]:my-0 [&[hidden=until-found]]:border-s-0 [&[hidden]:not([hidden=until-found])]:hidden"
        closeOnRail
        :depth="depth + 1"
        :hidden="isTreeOpen ? undefined : 'until-found'"
        @beforematch="onBeforeMatch"
        @close="toggleTree">
        <Schema
          v-if="shouldRenderObjectProperties"
          :breadcrumb="childBreadcrumb"
          :compact="compact"
          :compositionPath="currentCompositionPath"
          :cycleKey="cycleKey"
          :depth="depth + 1"
          :eventBus="eventBus"
          :hideModelNames
          :level="level + 1"
          :name="name"
          noncollapsible
          :options="options"
          :schema="objectSchemaForChildren"
          :schemaContext="schemaContext" />
        <Schema
          v-else-if="shouldRenderArrayOfObjects && resolvedArrayItems"
          :compact="compact"
          :compositionPath="arrayItemsCompositionPath"
          :cycleKey="arrayItemsCycleKey"
          :depth="depth + 1"
          :eventBus="eventBus"
          :hideModelNames
          :level="level + 1"
          :name="name"
          noncollapsible
          :options="options"
          :schema="resolve.schema(resolvedArrayItems)"
          :schemaContext="schemaContext" />
      </SchemaRailPanel>

      <!-- A container renders its children directly with no depth step. Not a
           v-else of the panel: a collapsed tree row must not fall through here.
           6px under a description keeps the 12px rhythm (legacy: 9px). -->
      <div
        v-if="isExpandable && !isCyclicProperty && !isTreeRow"
        class="children [.property-description+&]:mt-1.5!">
        <Schema
          v-if="shouldRenderObjectProperties"
          :breadcrumb="childBreadcrumb"
          :compact="compact"
          :compositionPath="currentCompositionPath"
          :cycleKey="cycleKey"
          :depth="depth"
          :eventBus="eventBus"
          :hideModelNames
          :level="level + 1"
          :name="name"
          noncollapsible
          :options="options"
          :schema="objectSchemaForChildren"
          :schemaContext="schemaContext" />
        <Schema
          v-else-if="shouldRenderArrayOfObjects && resolvedArrayItems"
          :compact="compact"
          :compositionPath="arrayItemsCompositionPath"
          :cycleKey="arrayItemsCycleKey"
          :depth="depth"
          :eventBus="eventBus"
          :hideModelNames
          :level="level + 1"
          :name="name"
          noncollapsible
          :options="options"
          :schema="resolve.schema(resolvedArrayItems)"
          :schemaContext="schemaContext" />
      </div>
    </template>

    <!-- Object -->
    <div
      v-if="!isTreeLayout && shouldRenderObjectProperties"
      class="children">
      <Schema
        :breadcrumb="childBreadcrumb"
        :compact="compact"
        :compositionPath="currentCompositionPath"
        :cycleKey="cycleKey"
        :eventBus="eventBus"
        :hideModelNames
        :level="level + 1"
        :name="name"
        :noncollapsible="noncollapsible"
        :options="options"
        :schema="objectSchemaForChildren"
        :schemaContext="schemaContext" />
    </div>

    <!-- Array of objects or nested arrays -->
    <div
      v-if="!isTreeLayout && shouldRenderArrayOfObjects && resolvedArrayItems"
      class="children">
      <Schema
        :compact="compact"
        :compositionPath="arrayItemsCompositionPath"
        :cycleKey="arrayItemsCycleKey"
        :eventBus="eventBus"
        :hideModelNames
        :level="level + 1"
        :name="name"
        :noncollapsible="noncollapsible"
        :options="options"
        :schema="resolve.schema(resolvedArrayItems)"
        :schemaContext="schemaContext" />
    </div>

    <!-- Compositions -->
    <!-- Tree layout: this row's own breadcrumb, so sibling compositions do not
         collide on anchors and expansion keys. The legacy layout keeps the
         parent path, because changing it would move anchor ids already shared. -->
    <SchemaComposition
      v-for="compositionData in compositionsToRender"
      :key="compositionData.composition"
      :breadcrumb="isTreeLayout ? childBreadcrumb : breadcrumb"
      :compact="compact"
      :composition="compositionData.composition"
      :compositionPath="currentCompositionPath"
      :depth="depth"
      :discriminator="getCompositionDiscriminator(compositionData.composition)"
      :eventBus="eventBus"
      :hideHeading="hideHeading"
      :hideModelNames
      :level="level"
      :name="name"
      :noncollapsible="noncollapsible"
      :options="options"
      :schema="compositionData.value"
      :schemaContext="schemaContext" />
    <SpecificationExtension :value="optimizedValue" />
  </component>
</template>

<style scoped>
.property {
  color: var(--scalar-color-1);
  display: flex;
  flex-direction: column;
  padding: 10px;
  font-size: var(--scalar-small);
  position: relative;
}

/*
 * Legacy-layout paddings, excluded from `.property--tree` rather than deleted:
 * the tree spaces itself from --schema-row-pad, and the legacy layout still ships.
 */
/* Legacy rule; the tree only excludes itself here. */
/** Remove top padding for top level schema card */
.property.property--level-0:not(.property--tree):has(
    > .property-rule
      > .schema-card
      > .schema-properties.schema-properties-open
      > ul
      > li.property
  ) {
  padding-top: 0;
}

/* Legacy rule; the tree only excludes itself here. */
.property--compact.property--level-0:not(.property--tree),
.property--compact.property--level-1:not(.property--tree) {
  padding: 10px 0;
}

/* Legacy rule; the tree only excludes itself here. */
.composition-panel
  .property.property.property.property--level-0:not(.property--tree) {
  padding: 0px;
}

/* Legacy rule; the tree only excludes itself here. */
.property--compact.property--level-0
  .composition-panel
  .property--compact.property--level-1:not(.property--tree) {
  padding: 8px;
}

/*  if a property doesn't have a heading, remove the top padding */
.property:has(> .property-rule:nth-of-type(1)):not(.property--compact) {
  padding-top: 8px;
  padding-bottom: 8px;
}

.property--deprecated {
  background: repeating-linear-gradient(
    -45deg,
    var(--scalar-background-2) 0,
    var(--scalar-background-2) 2px,
    transparent 2px,
    transparent 5px
  );
  background-size: 100%;
}

.property--deprecated > * {
  opacity: 0.75;
}

.property-description {
  margin-top: 6px;
  line-height: 1.4;
  font-size: var(--scalar-small);
}

.property-description:has(+ .property-rule) {
  margin-bottom: 9px;
}

:deep(.property-description) * {
  color: var(--scalar-color-2) !important;
}

.property:not(:last-of-type) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}

.property-description + .children,
.children + .property-rule {
  margin-top: 9px;
}

.children {
  display: flex;
  flex-direction: column;
}

.children .property--compact.property--level-1 {
  padding: 12px;
}

.property-example-value {
  all: unset;
  font-family: var(--scalar-font-code);
  padding: 6px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}

.property-rule {
  border-radius: var(--scalar-radius-lg);
  display: flex;
  flex-direction: column;
}

/* Legacy rule; the tree only excludes itself here. */
.property--level-2:not(.property--tree) :deep(.relative > button) {
  left: -2rem;
}

/* Legacy rule; the tree only excludes itself here. */
/* The tree panel keeps the composition-panel marker class, so without the :not() this card chrome leaks into the tree. */
.property-rule
  :deep(
    .composition-panel:not(.composition-panel--tree)
      .schema-card--level-1
      > .schema-properties.schema-properties-open
  ) {
  border-radius: 0 0 var(--scalar-radius-lg) var(--scalar-radius-lg);
}

/* Legacy rule; the tree only excludes itself here. */
.property-rule
  :deep(
    .composition-panel:not(.composition-panel--tree)
      > .schema-card
      > .schema-card-description
  ) {
  padding: 10px;
  border-left: var(--scalar-border-width) solid var(--scalar-border-color);
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);

  & + .schema-properties {
    margin-top: 0;
  }
}

.property-example {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.property-example-label,
.property-example-value {
  padding: 3px 0 0 0;
}

.property-example-value {
  background: var(--scalar-background-2);
  border-top: 0;
  border-radius: var(--scalar-radius);
  padding: 3px 4px;
}

.property-name {
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-semibold);
}

.property-name-additional-properties::before,
.property-name-pattern-properties::before {
  text-transform: uppercase;
  font-size: var(--scalar-micro);
  display: inline-block;
  padding: 2px 4px;
  border-radius: var(--scalar-radius);
  color: var(--scalar-color-1);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  background-color: var(--scalar-background-2);
  margin-right: 4px;
}

.property-name-pattern-properties::before {
  content: 'regex';
}

.property-name-additional-properties,
.property-name-pattern-properties {
  border: 1px dashed var(--scalar-border-color);
  color: var(--scalar-color-accent);
  display: inline-block;
  padding: 2px;
  border-radius: var(--scalar-radius);
}
</style>
