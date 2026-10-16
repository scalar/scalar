<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getBooleanSchema } from '@scalar/workspace-store/helpers/get-boolean-schema'
import { resolve } from '@scalar/workspace-store/resolve'
import type {
  SchemaObject,
  SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed, inject, toRef, useId } from 'vue'

import { isOnSchemaTargetPath } from './helpers/is-on-schema-target-path'
import { getCycleKey, SCHEMA_ANCESTORS_SYMBOL } from './helpers/schema-cycle'
import { toNodeKey, useSchemaExpansion } from './helpers/schema-expansion'
import { useLocalization } from './localization'
import Schema from './Schema.vue'
import SchemaGutterToggle from './SchemaGutterToggle.vue'
import SchemaRailPanel from './SchemaRailPanel.vue'
import type { SchemaOptions, SchemaRenderingProps } from './types'

const {
  label,
  branches,
  breadcrumb,
  options,
  expansion: expansionProp,
  scrollTargetId,
  requiredProperties,
} = defineProps<
  {
    label: string
    branches: {
      key: string
      label?: string
      schema: SchemaReferenceType<SchemaObject> | boolean
    }[]
    requiredProperties?: string[]
    breadcrumb: string[]
    options: SchemaOptions
    eventBus: WorkspaceEventBus | null
    depth: number
    level: number
  } & SchemaRenderingProps
>()
const { translate } = useLocalization()
const panelId = useId()
const labelId = useId()
const expansion =
  expansionProp ?? useSchemaExpansion(toRef(() => scrollTargetId ?? ''))
const nodeKey = computed((): string => toNodeKey(breadcrumb))
const ancestors = inject(SCHEMA_ANCESTORS_SYMBOL, undefined)
const open = computed((): boolean =>
  expansion.isExpanded(nodeKey.value, {
    defaultOpen:
      !!options.expandAllSchemaProperties ||
      isOnSchemaTargetPath(toNodeKey(breadcrumb), scrollTargetId ?? ''),
  }),
)
const toggle = (): void => expansion.setExpanded(nodeKey.value, !open.value)
const views = computed(() =>
  branches.map((branch) => {
    const cycleKey = getCycleKey(branch.schema)
    const schema = resolve.schema(branch.schema)
    const required = 'required' in schema ? schema.required : undefined
    return {
      ...branch,
      cycleKey,
      cyclic: cycleKey !== undefined && !!ancestors?.has(cycleKey),
      schema: Object.keys(schema).length ? schema : getBooleanSchema(true),
      required,
    }
  }),
)
</script>
<template>
  <div class="relative py-1.5 text-sm">
    <SchemaGutterToggle
      class="absolute start-[calc(0px_-_var(--schema-toggle-half,12px)_-_var(--schema-gutter,16px))] top-4 -translate-y-1/2"
      :fallbackLabel="label"
      :nameId="labelId"
      :open
      :panelId
      :panelRendered="open"
      @toggle="toggle" />
    <span
      :id="labelId"
      class="text-c-2 cursor-pointer text-left"
      @click="toggle">
      {{ label }}
    </span>
    <SchemaRailPanel
      v-if="open"
      :id="panelId"
      class="mt-1.5"
      closeOnRail
      :depth="depth + 1"
      @close="toggle">
      <p
        v-if="requiredProperties !== undefined"
        class="text-c-2 py-1.5">
        {{
          requiredProperties.length
            ? translate('schema.requiredProperties', {
                names: requiredProperties.join(', '),
              })
            : translate('schema.noAdditionalConstraint')
        }}
      </p>
      <div
        v-for="branch in views"
        :key="branch.key">
        <p
          v-if="branch.label"
          class="text-c-2 py-1.5 font-medium">
          {{ branch.label }}
        </p>
        <p
          v-if="branch.required?.length"
          class="text-c-2 py-1.5">
          {{
            translate('schema.requiredProperties', {
              names: branch.required.join(', '),
            })
          }}
        </p>
        <p
          v-if="branch.cyclic"
          class="text-c-2 py-1.5">
          {{ translate('schema.recursive') }}
        </p>
        <Schema
          v-else
          :breadcrumb="[...breadcrumb, branch.key]"
          :cycleKey="branch.cycleKey"
          :depth="depth + 1"
          :eventBus
          :expansion
          :level="level + 1"
          noncollapsible
          :options
          :schema="branch.schema"
          :scrollTargetId
          :specificationExtension />
      </div>
    </SchemaRailPanel>
  </div>
</template>
