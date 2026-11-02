<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, useId } from 'vue'

import { schemaDialect, type ConstraintSchema } from './constraint-metadata'
import { useLocalization } from './localization'
import SchemaConstraint from './SchemaConstraint.vue'
import type { SchemaOptions, SchemaRenderingProps } from './types'

const { schema, breadcrumb } = defineProps<
  {
    schema: ConstraintSchema
    options: SchemaOptions
    eventBus: WorkspaceEventBus | null
    depth: number
    level: number
    breadcrumb?: string[]
  } & SchemaRenderingProps
>()
const { translate } = useLocalization()
const anonymousKey = useId()
const constraintBreadcrumb = computed(() => [
  ...(breadcrumb ?? [`~anonymous-${anonymousKey}`]),
  '~constraints',
])

const branches = computed(() =>
  (['if', 'then', 'else'] as const).flatMap((key) =>
    schema[key] === undefined
      ? []
      : [
          {
            key,
            label: translate(
              `schema.constraint${key === 'if' ? 'If' : key === 'then' ? 'Then' : 'Else'}`,
            ),
            schema: schema[key],
          },
        ],
  ),
)
const dependencyLabelParts = computed(() =>
  translate('schema.dependencyConstraint').split('{name}'),
)
const modernDialect = computed(() => schema[schemaDialect] !== 'draft-07')
const containsLabel = computed(() =>
  modernDialect.value &&
  (schema.minContains !== undefined || schema.maxContains !== undefined)
    ? translate('schema.containsMatchingItems', {
        minimum: schema.minContains ?? 1,
        maximum: schema.maxContains ?? '∞',
      })
    : translate('schema.containsConstraint'),
)
const dependencies = computed(() =>
  (modernDialect.value
    ? (['dependentRequired', 'dependentSchemas'] as const)
    : (['dependencies'] as const)
  ).flatMap((keyword) =>
    Object.entries(schema[keyword] ?? {}).map(([name, dependency]) => ({
      keyword,
      name,
      dependency,
    })),
  ),
)
</script>
<template>
  <div class="schema-constraints">
    <SchemaConstraint
      v-if="schema.if !== undefined"
      :branches
      :breadcrumb="[...constraintBreadcrumb, 'conditional']"
      :depth
      :eventBus
      :expansion
      :label="translate('schema.conditionalConstraints')"
      :level
      :options
      :scrollTargetId
      :specificationExtension />
    <SchemaConstraint
      v-if="schema.contains !== undefined"
      :branches="[{ key: 'contains', schema: schema.contains }]"
      :breadcrumb="[...constraintBreadcrumb, 'contains']"
      :depth
      :eventBus
      :expansion
      :label="containsLabel"
      :level
      :options
      :scrollTargetId
      :specificationExtension />
    <SchemaConstraint
      v-for="{ keyword, name, dependency } in dependencies"
      :key="`${keyword}:${name}`"
      :branches="
        Array.isArray(dependency) ? [] : [{ key: name, schema: dependency }]
      "
      :breadcrumb="[...constraintBreadcrumb, keyword, name]"
      :depth
      :eventBus
      :expansion
      :label="translate('schema.dependencyConstraint', { name })"
      :level
      :options
      :requiredProperties="Array.isArray(dependency) ? dependency : undefined"
      :scrollTargetId
      :specificationExtension>
      <template #label>
        <template
          v-for="(part, index) in dependencyLabelParts"
          :key="index">
          <span
            v-if="index"
            class="font-code text-c-1"
            >{{ name }}</span
          >{{ part }}
        </template>
      </template>
    </SchemaConstraint>
  </div>
</template>
