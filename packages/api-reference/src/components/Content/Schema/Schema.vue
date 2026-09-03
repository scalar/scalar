<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components/icon'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { pushDynamicScope } from '@scalar/workspace-store/helpers/dynamic-ref'
import { resolve } from '@scalar/workspace-store/resolve'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, inject, provide, useId, useTemplateRef } from 'vue'

import type { SchemaOptions } from '@/components/Content/Schema/types'
import ScreenReader from '@/components/ScreenReader.vue'
import { useLocalization } from '@/features/localization'
import { isOnScrollTargetPath } from '@/helpers/lazy-bus'

import {
  resolveDynamicSchema,
  SCHEMA_DYNAMIC_SCOPE_SYMBOL,
  useDynamicScope,
} from './helpers/dynamic-scope'
import { inferDiscriminatorMappingComposition } from './helpers/get-compositions-to-render'
import { isEmptySchemaObject } from './helpers/is-empty-schema-object'
import { isTypeObject } from './helpers/is-type-object'
import { mergeAllOfSchemas } from './helpers/merge-all-of-schemas'
import { SCHEMA_ANCESTORS_SYMBOL } from './helpers/schema-cycle'
import {
  SCHEMA_TREE_ROOT_SYMBOL,
  toNodeKey,
  useSchemaExpansion,
} from './helpers/schema-expansion'
import { handleTreeKeydown } from './helpers/schema-keyboard-nav'
import { useSchemaLayout } from './helpers/use-schema-layout'
import SchemaComposition from './SchemaComposition.vue'
import SchemaGlyphPuck from './SchemaGlyphPuck.vue'
import SchemaHeading from './SchemaHeading.vue'
import SchemaObjectProperties from './SchemaObjectProperties.vue'
import SchemaProperty from './SchemaProperty.vue'

const {
  schema,
  level = 0,
  depth = 0,
  name,
  compact,
  noncollapsible = false,
  hideHeading,
  hideDescription = false,
  additionalProperties,
  discriminator,
  breadcrumb,
  hideModelNames = false,
  options,
  schemaContext,
  compositionPath,
  cycleKey,
} = defineProps<{
  schema?: SchemaObject
  /** Track how deep we've gone */
  level?: number
  /**
   * Real nesting depth in the tree layout. Not derived from `level`, whose
   * stride differs per edge (object +2, composition +1, non-object root +0).
   */
  depth?: number
  /* Show as a heading */
  name?: string
  /** A tighter layout with less borders and without a heading */
  compact?: boolean
  /** Shows a toggle to hide/show children */
  noncollapsible?: boolean
  /** Hide the heading */
  hideHeading?: boolean
  /** Hide the schema description */
  hideDescription?: boolean
  /** Show a special one way toggle for additional properties, also has a top border when open */
  additionalProperties?: boolean
  /** Hide model names in type display */
  hideModelNames?: boolean
  /** Discriminator object */
  discriminator?: DiscriminatorObject
  /** Breadcrumb for the schema */
  breadcrumb?: string[]
  /** Event bus emitting actions */
  eventBus: WorkspaceEventBus | null
  /** Move the options into a single prop so they are easy to pass around */
  options: SchemaOptions
  /** When "requestBody", composition dropdown selection is synced with the example snippet */
  schemaContext?: string
  /** Internal path used to sync nested request body compositions with the code sample */
  compositionPath?: string[]
  /**
   * Stable identity of this schema node, derived from its raw (unresolved)
   * value by the parent. Used to detect self-referential cycles. See
   * {@link getCycleKey}.
   */
  cycleKey?: unknown
}>()
const { translate } = useLocalization()

/**
 * The dynamic scope inherited from ancestor schema resources.
 *
 * Used to bind JSON Schema 2020-12 `$dynamicRef`s to the active `$dynamicAnchor` while walking the
 * tree. Empty at the root. See {@link useDynamicScope}.
 */
const dynamicScope = useDynamicScope()

/**
 * The schema this node actually renders.
 *
 * Two normalizations happen here, both no-ops for ordinary schemas:
 * - A top-level `$dynamicRef` is bound to its concrete type via the inherited dynamic scope.
 * - A resource that extends a template through a root `$ref` (JSON Schema 2020-12 `$ref` alongside
 *   `$defs`, e.g. a `PaginatedResponse` binding) is merged so its inherited properties render.
 */
const resolvedSchema = computed((): SchemaObject | undefined => {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const bound = resolveDynamicSchema(schema, dynamicScope)
  return '$ref' in bound ? resolve.schema(bound) : bound
})

/**
 * Re-provide the dynamic scope grown with this resource so nested `$dynamicRef`s bind here.
 *
 * Built once at setup from the resource's stable identity (like the ancestor set below);
 * `pushDynamicScope` only grows the scope for schemas that can carry a `$dynamicAnchor`.
 *
 * The raw schema is pushed, not the merged {@link resolvedSchema}: merging through `resolve.schema`
 * coerces the node and drops the resolved `$ref-value` from entries inside `$defs`, which
 * `$dynamicAnchor` resolution relies on to dereference the bound type (e.g. `User`).
 */
const scopeSchema = schema
  ? resolveDynamicSchema(schema, dynamicScope)
  : undefined
provide(
  SCHEMA_DYNAMIC_SCOPE_SYMBOL,
  scopeSchema ? pushDynamicScope(dynamicScope, scopeSchema) : dynamicScope,
)

/**
 * Cycle-safe `expandAllSchemaProperties`.
 *
 * We track ancestor schema keys along the current render path. A node is
 * treated as cyclic when its key is already present in the ancestor set, which
 * indicates that rendering has looped back onto a self-referential schema.
 *
 * This lets us default-expand finite branches while stopping automatic
 * expansion only at cycle boundaries, preventing infinite recursion.
 */
const ancestors = inject(SCHEMA_ANCESTORS_SYMBOL, undefined)

const isCyclic = computed(
  (): boolean => cycleKey != null && !!ancestors?.has(cycleKey),
)

// Re-provide the ancestor set augmented with this node so descendants can
// detect cycles back to it. Built once at setup; a node's key is stable.
const childAncestors = new Set<unknown>(ancestors ?? [])
if (cycleKey != null) {
  childAncestors.add(cycleKey)
}
provide(SCHEMA_ANCESTORS_SYMBOL, childAncestors)

const shouldForceExpand = computed(
  (): boolean => !!options.expandAllSchemaProperties && !isCyclic.value,
)

/**
 * Determines whether to show the collapse/expand toggle button.
 * We hide the toggle for non-collapsible schemas and root-level schemas.
 */
const shouldShowToggle = computed((): boolean => !noncollapsible && level > 0)

/**
 * Whether this schema sits on the path to the current anchor/scroll target.
 *
 * Property anchors are dot-joined breadcrumbs, so every disclosure that wraps
 * the target has a breadcrumb that is a prefix of the target id. Opening those
 * disclosures is what makes deep links to collapsed (hidden) properties work
 * without forcing every schema open via `expandAllSchemaProperties`.
 */
const isOnTargetPath = computed((): boolean =>
  isOnScrollTargetPath(toNodeKey(breadcrumb)),
)

/**
 * Whether the disclosure starts expanded. Non-collapsible schemas are always
 * open. When `expandAllSchemaProperties` is enabled, finite branches start
 * expanded by default while cyclic branches remain collapsed to avoid recursion
 * loops. We also open any disclosure on the path to the current scroll target so
 * deep links resolve even when the property is collapsed.
 *
 * This is only the last step of the store's resolution order: it applies when
 * nobody has touched this node and no bulk action or baseline covers it.
 */
const defaultOpen = computed(
  (): boolean =>
    noncollapsible || shouldForceExpand.value || isOnTargetPath.value,
)

const childAttributesLabel = computed(
  (): string => schema?.title ?? translate('schema.childAttributes'),
)

/** Gets the description to show for the schema */
const schemaDescription = computed(() => {
  const value = resolvedSchema.value

  if (hideDescription) {
    return null
  }

  // For the request body we want to show the description of the merged allOf schema.
  // Merging keeps the base description (when set) and otherwise lets the last allOf
  // member win, matching how the merged composition is rendered below. The nested
  // merged Schema in `SchemaComposition` hides its own description in this case so
  // the text is not rendered twice.
  if (schema?.allOf && schema.allOf.length > 0 && name === 'Request Body') {
    return mergeAllOfSchemas(schema)?.description || null
  }

  // Don't show description if there's no description or it's not a string
  if (!value?.description || typeof value.description !== 'string') {
    return null
  }

  // Don't show description for enum schemas (they have special handling)
  if (value.enum) {
    return null
  }

  // Will be shown in the properties anyway. A composed schema is the exception:
  // its members render as their own cards with their own descriptions, so the
  // schema's own description has nowhere else to go.
  if (
    !('properties' in value) &&
    !('patternProperties' in value) &&
    !('additionalProperties' in value) &&
    !('allOf' in value)
  ) {
    return null
  }

  // Return the schema's own description
  return value.description
})

/**
 * Infer a selector for mapped discriminators that do not declare `oneOf`.
 * Threaded discriminators skip inference to avoid recursive allOf variants.
 */
const inferredDiscriminatorComposition = computed(() =>
  schema && !discriminator && isTypeObject(schema)
    ? inferDiscriminatorMappingComposition(schema, options.document)
    : null,
)

const { isTreeLayout } = useSchemaLayout(() => options.schemaLayout)

/**
 * Whether an enclosing Schema already established a tree root. `depth === 0`
 * alone is not enough: a nested Schema can mount at depth 0 (an `allOf`
 * member, or a caller that omits `depth`), and a second root would mount a
 * second sticky strip and keydown root, firing every arrow key twice.
 */
const hasTreeRootAbove = inject(SCHEMA_TREE_ROOT_SYMBOL, false)

/** Both flagged tree features live on the outermost tree root only */
const isTreeRoot = computed(
  (): boolean => isTreeLayout.value && depth === 0 && !hasTreeRootAbove,
)

// Descendants must know a root exists above them, whatever depth they mount at.
provide(SCHEMA_TREE_ROOT_SYMBOL, true)

/** Delegated arrow-key navigation, active only when the flag is on */
const onTreeKeydown = (event: KeyboardEvent): void => {
  if (isTreeRoot.value && options.schemaKeyboardNav) {
    handleTreeKeydown(event)
  }
}

const expansion = useSchemaExpansion()

/**
 * Fallback identity for nodes mounted without a breadcrumb (models, AsyncAPI
 * messages, the classic layouts). Until those surfaces pass real breadcrumbs,
 * this keeps them from all resolving to the empty key and toggling as one node.
 */
const anonymousKey = useId()

const nodeKey = computed(
  (): string => toNodeKey(breadcrumb) || `~anonymous-${anonymousKey}`,
)

/**
 * Whether this disclosure is open. Resolved from the store on every read, not
 * latched at mount, so a second deep link into an already-rendered operation
 * works and expansion survives the composition variant remount.
 */
const open = computed(
  (): boolean =>
    noncollapsible ||
    expansion.isExpanded(nodeKey.value, {
      cyclic: isCyclic.value,
      defaultOpen: defaultOpen.value,
    }),
)

/** The panel is always present for a schema that has no toggle of its own. */
const isPanelStatic = computed((): boolean => !shouldShowToggle.value)

/** Additional-property panels hide until opened; static panels always render */
const panelRendered = computed(
  (): boolean =>
    (!additionalProperties || open.value) &&
    (isPanelStatic.value || open.value),
)

const toggleId = useId()
const panelId = useId()

const panelRef = useTemplateRef<HTMLElement>('panel')
const toggleRef = useTemplateRef<HTMLElement>('toggle')

const toggle = (): void => {
  if (noncollapsible) {
    return
  }

  const next = !open.value

  /**
   * Collapsing a subtree that holds the focused element would drop focus to
   * `<body>` as the panel unmounts, so move it to this row's toggle first.
   */
  if (!next) {
    const active = document.activeElement

    if (active && panelRef.value?.contains(active)) {
      toggleRef.value?.focus()
    }
  }

  expansion.setExpanded(nodeKey.value, next)
}
</script>
<template>
  <!--
    Not a Headless UI `<Disclosure>`: it has no controlled mode, and expansion
    is driven from the store, so the button and the panel are owned directly.
  -->
  <div
    v-if="resolvedSchema && Object.keys(resolvedSchema).length"
    class="schema-card"
    :class="[
      `schema-card--level-${level}`,
      { 'schema-card--compact': compact, 'schema-card--open': open },
      { 'border-t': additionalProperties && open && !isTreeLayout },
      /*
       * No margin of its own: the row above already ends with its own 6px pad,
       * so the reveal keeps the tree's row-to-row rhythm exactly.
       */
      { 'additional-card--tree': additionalProperties && isTreeLayout },
      { 'schema-card--tree': isTreeLayout },
      /*
       * Tree-local tokens, namespaced --schema-* so no preset or user theme
       * breaks. WCAG 1.4.11 wants 3:1 for the glyph; --scalar-color-3 measures
       * 3.28:1 only before opacity, so the glyph reads color-2. The narrow
       * container tightens the indent and the control sizes, but that lives at
       * app scope (styles/tailwind.config.css) with the other rail tokens: the
       * surfaces above a tree root draw rails too, and they must tighten with
       * it or their glyphs land on a different line.
       */
      {
        'schema-tree [--schema-glyph-background:var(--scalar-background-1)] [--schema-glyph-color:var(--scalar-color-2)]':
          isTreeRoot,
      },
    ]"
    @keydown="onTreeKeydown">
    <!-- Schema description -->
    <!-- Tree layout: without the card box the legacy level-0 divider (and its
         negative-margin tuck) is a stray line, so the tree drops the whole treatment -->
    <div
      v-if="schemaDescription"
      class="schema-card-description"
      :class="{
        '[.schema-card--level-0:nth-of-type(1)>&]:has-[+.schema-properties]:mb-0! [.schema-card--level-0:nth-of-type(1)>&]:has-[+.schema-properties]:border-b-0! [.schema-card--level-0:nth-of-type(1)>&]:has-[+.schema-properties]:pb-0!':
          isTreeLayout,
      }">
      <ScalarMarkdown :value="schemaDescription" />
    </div>
    <div
      v-if="isEmptySchemaObject(resolvedSchema)"
      :class="isTreeLayout ? 'text-c-2 py-1.5' : 'pt-2'">
      {{ translate('schema.emptyObject') }}
    </div>
    <!-- Tree layout: a rail per depth instead of a bordered box per level, so
         the card chrome goes. 6px under a description keeps the 12px row
         rhythm (legacy keeps 8px); at level 0 the divider is gone, so even that
         6px would double up with the first row's own padding. -->
    <div
      class="schema-properties"
      :class="{
        'schema-properties-open': open,
        'w-full! rounded-none! border-0! [.schema-card--level-0:nth-of-type(1)>.schema-card-description+&]:mt-0! [.schema-card-description+&]:mt-1.5!':
          isTreeLayout,
      }">
      <!-- Toggle to collapse/expand long lists of properties -->
      <div
        v-if="additionalProperties"
        v-show="!open"
        class="schema-properties"
        :class="{ 'w-full! rounded-none! border-0!': isTreeLayout }">
        <!-- Tree layout: the reveal reads as one more row — mono label flush
             with the sibling rows' text, a plus puck centred on the sibling
             toggles' line — in place of the legacy card-title chrome.
             `min-h-8` is the row's own 32px: the label then centres in the
             same 20px slot a heading gets, so the first revealed property
             lands exactly where the label was instead of 2.5px below it. -->
        <button
          :id="toggleId"
          ref="toggle"
          :aria-controls="panelRendered ? panelId : undefined"
          :aria-expanded="open"
          class="schema-card-title schema-card-title--compact group/tree-control"
          :class="{
            'additional-toggle--tree font-code text-c-1! relative flex h-auto min-h-8 items-center gap-0! px-0! py-[var(--schema-row-pad,6px)]! text-sm! font-bold!':
              isTreeLayout,
          }"
          type="button"
          @click="toggle">
          <!-- Tree layout: the reveal is one more row of the tree, so its plus
               is the same puck the row toggles draw, on the same gutter line -->
          <SchemaGlyphPuck
            v-if="isTreeLayout"
            class="additional-toggle-glyph" />
          <ScalarIcon
            v-else
            class="schema-card-title-icon"
            icon="Add"
            size="sm" />
          <span class="additional-toggle-label">
            {{ translate('schema.showAdditionalProperties') }}
            <ScreenReader v-if="name">
              {{ translate('schema.forName', { name }) }}
            </ScreenReader>
          </span>
        </button>
      </div>

      <!-- Still a `div` when noncollapsible, so the legacy markup is unchanged;
           it has no role or tab stop, which the gutter control later fixes. -->
      <component
        :is="noncollapsible ? 'div' : 'button'"
        v-else-if="shouldShowToggle"
        v-show="!hideHeading && !(noncollapsible && compact)"
        :id="noncollapsible ? undefined : toggleId"
        ref="toggle"
        :aria-controls="!noncollapsible && panelRendered ? panelId : undefined"
        :aria-expanded="noncollapsible ? undefined : open"
        class="schema-card-title"
        :class="{ 'schema-card-title--compact': compact }"
        :style="{
          top: `calc(var(--refs-viewport-offset) +  calc(var(--schema-title-height) * ${level}))`,
        }"
        :type="noncollapsible ? undefined : 'button'"
        @click="toggle">
        <template v-if="compact">
          <ScalarIcon
            class="schema-card-title-icon"
            :class="{ 'schema-card-title-icon--open': open }"
            icon="Add"
            size="sm" />
          <template v-if="open">
            {{
              translate('schema.hideChildAttributes', {
                name: childAttributesLabel,
              })
            }}
          </template>
          <template v-else>
            {{
              translate('schema.showChildAttributes', {
                name: childAttributesLabel,
              })
            }}
          </template>
          <ScreenReader v-if="name">
            {{ translate('schema.forName', { name }) }}
          </ScreenReader>
        </template>
        <template v-else>
          <ScalarIcon
            class="schema-card-title-icon"
            :class="{ 'schema-card-title-icon--open': open }"
            icon="Add"
            size="sm" />
          <SchemaHeading
            :name="resolvedSchema?.title ?? name"
            :value="resolvedSchema" />
        </template>
      </component>
      <!-- The theme reset strips list-style, which makes Safari and VoiceOver
           drop list semantics; an explicit role restores them. -->
      <ul
        v-if="panelRendered"
        :id="panelId"
        ref="panel"
        role="list">
        <!-- Variant selector inferred from a discriminator mapping -->
        <SchemaComposition
          v-if="inferredDiscriminatorComposition"
          :breadcrumb
          :compact
          composition="oneOf"
          :compositionPath="compositionPath"
          :discriminator="schema?.discriminator"
          :eventBus="eventBus"
          :hideHeading
          :depth="depth"
          :hideModelNames
          :level="level"
          :name="name"
          :options
          :schema="inferredDiscriminatorComposition"
          :schemaContext="schemaContext" />
        <!-- Object properties -->
        <SchemaObjectProperties
          v-else-if="isTypeObject(resolvedSchema)"
          :breadcrumb
          :compact
          :compositionPath="compositionPath"
          :discriminator
          :eventBus="eventBus"
          :hideHeading
          :depth="depth"
          :hideModelNames
          :level="level + 1"
          :options
          :schema="resolvedSchema"
          :schemaContext="schemaContext" />
        <!-- Not an object -->
        <template v-else>
          <SchemaProperty
            v-if="resolvedSchema"
            :breadcrumb
            :compact
            :compositionPath="compositionPath"
            :discriminator
            :eventBus="eventBus"
            :hideHeading
            :depth="depth"
            :hideModelNames
            :level
            :options
            :schema="resolvedSchema"
            :schemaContext="schemaContext" />
        </template>
      </ul>
    </div>
  </div>
</template>
<style scoped>
.error {
  background-color: var(--scalar-color-red);
}
.schema-card {
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-1);
}
.schema-card-title {
  height: var(--schema-title-height);

  padding: 6px 8px;

  display: flex;
  align-items: center;
  gap: 4px;

  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  border-bottom: var(--scalar-border-width) solid transparent;
}
button.schema-card-title {
  cursor: pointer;
}
button.schema-card-title:hover {
  color: var(--scalar-color-1);
}
.schema-card-title-icon--open {
  transform: rotate(45deg);
}
.schema-properties-open > .schema-card-title {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.schema-properties-open > .schema-properties {
  width: fit-content;
}
.schema-card-description {
  color: var(--scalar-color-2);
}
.schema-card-description + .schema-properties {
  width: fit-content;
}
.schema-card-description + .schema-properties {
  margin-top: 8px;
}
.schema-card--level-0:nth-of-type(1)
  > .schema-card-description:has(+ .schema-properties) {
  margin-bottom: -8px;
  padding-bottom: 8px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.schema-card--level-0
  ~ .schema-card--level-0
  > .schema-card-description:has(+ .schema-properties) {
  padding-top: 8px;
}

.schema-properties-open.schema-properties,
.schema-properties-open > .schema-card--open {
  width: 100%;
}
.schema-properties {
  display: flex;
  flex-direction: column;

  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  width: fit-content;
}
.schema-properties-name {
  width: 100%;
}
.schema-properties .schema-properties {
  border-radius: 13.5px;
}
.schema-properties .schema-properties.schema-properties-open {
  border-radius: var(--scalar-radius-lg);
}
.schema-properties-open {
  width: 100%;
}
.schema-card--compact {
  align-self: flex-start;
}
.schema-card--compact.schema-card--open {
  align-self: initial;
}
.schema-card-title--compact {
  color: var(--scalar-color-2);
  padding: 6px 10px 6px 8px;
  height: auto;
  border-bottom: none;
}
.schema-card-title--compact > .schema-card-title-icon {
  margin: 0;
}
.schema-card-title--compact > .schema-card-title-icon--open {
  transform: rotate(45deg);
}
.schema-properties-open > .schema-card-title--compact {
  position: static;
}
.property--level-0
  > .schema-properties
  > .schema-card--level-0
  > .schema-properties {
  border: none;
}
.property--level-0
  .schema-card--level-0:not(.schema-card--compact)
  .property--level-1 {
  padding: 0 0 8px;
}
:not(.composition-panel)
  > .schema-card--compact.schema-card--level-0
  > .schema-properties {
  border: none;
}
:deep(.schema-card-description) p {
  font-size: var(--scalar-small, var(--scalar-paragraph));
  color: var(--scalar-color-2);
  margin-bottom: 0;
  display: block;
  margin-bottom: 6px;
}
.children .schema-card-description:first-of-type {
  padding-top: 0;
}
</style>
