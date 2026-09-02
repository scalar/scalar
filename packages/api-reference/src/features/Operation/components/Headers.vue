<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components/icon'
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
import { useSchemaLayout } from '@/components/Content/Schema/helpers/use-schema-layout'
import SchemaGutterToggle from '@/components/Content/Schema/SchemaGutterToggle.vue'
import SchemaRailPanel from '@/components/Content/Schema/SchemaRailPanel.vue'
import { useLocalization } from '@/features/localization'

import Header from './Header.vue'

const {
  headers,
  breadcrumb,
  schemaLayout,
  schemaKeyboardNav,
  expandAllSchemaProperties,
} = defineProps<{
  headers: Record<string, HeaderObject>
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  /** The document the headers belong to, used to resolve schema references for display */
  document?: OpenApiDocument
  orderRequiredPropertiesFirst: boolean | undefined
  orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  expandAllSchemaProperties: boolean | undefined
  schemaLayout: 'legacy' | 'tree' | undefined
  /** Whether arrow-key navigation is enabled (tree layout) */
  schemaKeyboardNav?: boolean | undefined
  /** Whether the models section is hidden, so model names render as plain text instead of links */
  hideModels: boolean | undefined
}>()
const { translate } = useLocalization()

const { isTreeLayout } = useSchemaLayout(() => schemaLayout)

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
 * Tree layout: headers become a child group keyed into the expansion store
 * like any other node, so expand-all and deep links reach them.
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

const isOpen = computed(
  (): boolean =>
    isTreeLayout.value &&
    expansion.isExpanded(nodeKey.value, {
      defaultOpen: !!expandAllSchemaProperties,
      anchorPath: toNodeKey(headersBreadcrumb.value),
    }),
)

const panelId = useId()
const nameId = useId()
const countId = useId()

const countLabel = computed(() =>
  translate('schema.propertyCount', {
    count: String(Object.keys(headers).length),
  }),
)
</script>
<template>
  <!-- Tree layout: outdented one gutter so, inside a railed response panel,
       the toggle straddles the rail and the label sits in the text column -->
  <div
    v-if="isTreeLayout"
    class="property property--tree headers-tree-group relative mt-1.5 py-1.5"
    @keydown="onGroupKeydown">
    <SchemaGutterToggle
      class="absolute start-[calc(-12px_-_var(--schema-gutter,16px))] top-[1.5px] z-[1]"
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
      <template
        v-for="(header, key) in headers"
        :key="key">
        <Header
          :breadcrumb="headersBreadcrumb"
          :document="document"
          :eventBus="eventBus"
          :expandAllSchemaProperties="expandAllSchemaProperties"
          :header="getResolvedRef(header)"
          :hideModels="hideModels"
          :name="key"
          :orderRequiredPropertiesFirst="orderRequiredPropertiesFirst"
          :orderSchemaPropertiesBy="orderSchemaPropertiesBy"
          :schemaKeyboardNav="schemaKeyboardNav"
          :schemaLayout="schemaLayout" />
      </template>
    </SchemaRailPanel>
  </div>

  <!-- Legacy: the headers card, untouched -->
  <Disclosure
    v-else
    v-slot="{ open }">
    <div
      class="headers-card headers-card--compact"
      :class="[{ 'headers-card--open': open }]">
      <div
        class="headers-properties"
        :class="{ 'headers-properties-open': open }">
        <DisclosureButton
          class="headers-card-title headers-card-title--compact"
          :style="{
            top: `calc(var(--refs-viewport-offset))`,
          }">
          <ScalarIcon
            class="headers-card-title-icon"
            :class="{ 'headers-card-title-icon--open': open }"
            icon="Add"
            size="sm" />
          <template v-if="open">
            {{ translate('operation.hideHeaders') }}
          </template>
          <template v-else>
            {{ translate('operation.showHeaders') }}
          </template>
        </DisclosureButton>
        <DisclosurePanel>
          <template
            v-for="(header, key) in headers"
            :key="key">
            <Header
              :breadcrumb="headersBreadcrumb"
              :document="document"
              :eventBus="eventBus"
              :expandAllSchemaProperties="expandAllSchemaProperties"
              :header="getResolvedRef(header)"
              :hideModels="hideModels"
              :name="key"
              :orderRequiredPropertiesFirst="orderRequiredPropertiesFirst"
              :orderSchemaPropertiesBy="orderSchemaPropertiesBy"
              :schemaKeyboardNav="schemaKeyboardNav"
              :schemaLayout="schemaLayout" />
          </template>
        </DisclosurePanel>
      </div>
    </div>
  </Disclosure>
</template>
<style scoped>
/* Tree-group styling lives in SchemaRailPanel and template utilities. Below: the legacy card. */

.headers-card {
  z-index: 0;
  margin-top: 12px;
  margin-bottom: 6px;
  position: relative;
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-1);

  align-self: flex-start;
}
.headers-card.headers-card--open {
  align-self: initial;
}
.headers-card-title {
  padding: 6px 10px;

  display: flex;
  align-items: center;
  gap: 4px;

  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-micro);

  border-radius: 13.5px;
}
button.headers-card-title {
  cursor: pointer;
}
button.headers-card-title:hover {
  color: var(--scalar-color-1);
}
.headers-card-title-icon--open {
  transform: rotate(45deg);
}
.headers-properties {
  display: flex;
  flex-direction: column;

  border: var(--scalar-border-width) solid var(--scalar-border-color);

  border-radius: 13.5px;
  width: fit-content;
}
.headers-properties-open > .headers-card-title {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.headers-properties-open {
  border-radius: var(--scalar-radius-lg);
  width: 100%;
}
.headers-card .property:last-of-type {
  padding-bottom: 10px;
}
</style>
