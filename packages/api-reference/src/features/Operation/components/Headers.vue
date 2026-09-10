<script lang="ts" setup>
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  HeaderObject,
  OpenApiDocument,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, useId } from 'vue'

import {
  toNodeKey,
  useSchemaExpansion,
} from '@/components/Content/Schema/helpers/schema-expansion'
import { handleTreeKeydown } from '@/components/Content/Schema/helpers/schema-keyboard-nav'
import SchemaGutterToggle from '@/components/Content/Schema/SchemaGutterToggle.vue'
import SchemaRailPanel from '@/components/Content/Schema/SchemaRailPanel.vue'
import { useLocalization } from '@/features/localization'

import Header from './Header.vue'

const { headers, breadcrumb, schemaKeyboardNav, expandAllSchemaProperties } =
  defineProps<{
    headers: Record<string, HeaderObject>
    breadcrumb?: string[]
    eventBus: WorkspaceEventBus | null
    /** The document the headers belong to, used to resolve schema references for display */
    document?: OpenApiDocument
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    expandAllSchemaProperties: boolean | undefined
    /** Whether arrow-key navigation is enabled */
    schemaKeyboardNav?: boolean | undefined
    /** Whether the models section is hidden, so model names render as plain text instead of links */
    hideModels: boolean | undefined
  }>()
const { translate } = useLocalization()

const resolvedHeaders = computed(() =>
  Object.fromEntries(
    Object.entries(headers).flatMap(
      ([name, header]): [string, HeaderObject][] => {
        const resolved = getResolvedRef(header)
        return resolved ? [[name, resolved]] : []
      },
    ),
  ),
)

/**
 * This group owns tree rows but sits beside the schema tree rather than inside
 * it, so arrow-key navigation only reaches its toggles when it delegates too.
 */
const onGroupKeydown = (event: KeyboardEvent): void => {
  if (schemaKeyboardNav) {
    handleTreeKeydown(event)
  }
}

/**
 * Headers are a child group keyed into the expansion store like any other
 * node, so expand-all and deep links reach them.
 */
const expansion = useSchemaExpansion()
const anonymousKey = useId()
/** The public anchor path of the headers, unchanged so shared links resolve. */
const headersBreadcrumb = computed(() =>
  breadcrumb ? [...breadcrumb, 'headers'] : undefined,
)

/**
 * The `~` marker matches other structural segments (`~items`, `~anonymous-`);
 * without it the group collides with a body property named `headers`. The
 * anchor path goes to the store separately so deep links still open the group.
 */
const nodeKey = computed(
  (): string =>
    (breadcrumb ? toNodeKey([...breadcrumb, '~headers']) : '') ||
    `~anonymous-${anonymousKey}`,
)

const isOpen = computed((): boolean =>
  expansion.isExpanded(nodeKey.value, {
    defaultOpen: !!expandAllSchemaProperties,
    anchorPath: toNodeKey(headersBreadcrumb.value),
  }),
)

const panelId = useId()
const nameId = useId()
const countId = useId()

const countLabel = computed(() =>
  translate('schema.headerCount', {
    count: String(Object.keys(resolvedHeaders.value).length),
  }),
)
</script>
<template>
  <!-- Outdented one gutter so, inside a railed response panel, the toggle
       straddles the rail and the label sits in the text column. Vertically it
       centres on the label's own line (6px is this row's py-1.5, `0.5lh` half
       the line box) so it holds at any control size. -->
  <div
    class="property property--tree headers-tree-group relative mt-1.5 py-1.5"
    @keydown="onGroupKeydown">
    <SchemaGutterToggle
      class="absolute start-[calc(0px_-_var(--schema-toggle-half,12px)_-_var(--schema-gutter,16px))] top-[calc(6px_+_0.5lh)] z-[1] -translate-y-1/2"
      :countId="countId"
      :fallbackLabel="translate('operation.headers')"
      :nameId="nameId"
      :open="isOpen"
      :panelId="panelId"
      :panelRendered="isOpen"
      @toggle="expansion.setExpanded(nodeKey, !isOpen)" />
    <!-- Pointer convenience for the same toggle; the gutter control stays the accessible one -->
    <div
      class="property-heading cursor-pointer"
      @click="expansion.setExpanded(nodeKey, !isOpen)">
      <span
        :id="nameId"
        class="property-name font-code text-sm [font-weight:var(--scalar-bold)]">
        {{ translate('operation.headers') }}
      </span>
    </div>
    <span
      :id="countId"
      class="screenreader-only"
      >{{ countLabel }}</span
    >
    <SchemaRailPanel
      v-if="isOpen"
      :id="panelId"
      class="property-children mt-1.5 mb-0.5"
      closeOnRail
      :depth="2"
      @close="expansion.setExpanded(nodeKey, false)">
      <!-- `Header` renders a `SchemaProperty`, whose root is an `li`, so the
           rows need a list to belong to: an `li` outside one is exposed as a
           plain generic and the group loses the "1 of 2" the schema rows get.
           The explicit role is the same guard Schema.vue needs — the theme
           reset strips `list-style`, which makes Safari and VoiceOver drop
           list semantics. -->
      <ul role="list">
        <template
          v-for="(header, key) in resolvedHeaders"
          :key="key">
          <Header
            :breadcrumb="headersBreadcrumb"
            :document="document"
            :eventBus="eventBus"
            :expandAllSchemaProperties="expandAllSchemaProperties"
            :header="header"
            :hideModels="hideModels"
            :name="key"
            :orderRequiredPropertiesFirst="orderRequiredPropertiesFirst"
            :orderSchemaPropertiesBy="orderSchemaPropertiesBy"
            :schemaKeyboardNav="schemaKeyboardNav" />
        </template>
      </ul>
    </SchemaRailPanel>
  </div>
</template>
