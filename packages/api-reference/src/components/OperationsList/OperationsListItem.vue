<script setup lang="ts">
import { getHttpMethodInfo } from '@scalar/helpers/http/http-info'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import { isOperationDeprecated } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1, XScalarStability } from '@scalar/types/legacy'
import { computed } from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import { SectionHeaderTag } from '@/components/Section'
import { useSidebar } from '@/features/sidebar'
import type {
  TraversedEntry,
  TraversedOperation,
  TraversedWebhook,
} from '@/features/traverse-schema'

const { operation } = defineProps<{
  operation: TraversedOperation | TraversedWebhook
  isCollapsed?: boolean
}>()

const { scrollToOperation } = useSidebar()

const scrollHandler = async (
  targetOperation: Pick<TraversedOperation, 'id'>,
) => {
  scrollToOperation(targetOperation.id, true)
}

const pathOrTitle = computed(() => {
  if ('path' in operation) {
    return operation.path
  }

  return operation.title
})

const isDeprecated = (
  operation: TraversedEntry,
): operation is TraversedOperation =>
  'operation' in operation &&
  isOperationDeprecated(
    operation.operation as OpenAPIV3_1.OperationObject<{
      'x-scalar-stability': XScalarStability
    }>,
  )

const isWebhook = (operation: TraversedEntry): operation is TraversedWebhook =>
  'webhook' in operation
</script>

<template>
  <li
    :key="operation.id"
    class="contents">
    <!-- If collapsed add hidden headers so they show up for screen readers -->
    <SectionHeaderTag
      v-if="isCollapsed"
      class="sr-only"
      :level="3">
      {{ operation.title }} (Hidden)
    </SectionHeaderTag>
    <a
      class="endpoint"
      :href="`#${operation.id}`"
      @click.prevent="scrollHandler(operation)">
      <HttpMethod
        class="endpoint-method items-center justify-end gap-2"
        :method="operation.method">
        <ScalarIconWebhooksLogo
          v-if="isWebhook(operation)"
          :style="{
            color: getHttpMethodInfo(operation.method).colorVar,
          }"
          class="size-3.5" />
      </HttpMethod>
      <span
        class="endpoint-path"
        :class="{ deprecated: isDeprecated(operation) }">
        {{ pathOrTitle }}
      </span>
    </a>
  </li>
</template>

<style scoped>
.endpoint {
  display: flex;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
}
.endpoint:hover .endpoint-path,
.endpoint:focus-visible .endpoint-path {
  text-decoration: underline;
}
.endpoint .post,
.endpoint .get,
.endpoint .delete,
.endpoint .put {
  white-space: nowrap;
}

.endpoint-method,
.endpoint-path {
  color: var(--scalar-color-1);
  min-width: 62px;
  display: inline-flex;
  line-height: 1.55;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
  cursor: pointer;
}

.endpoint-method {
  text-align: right;
}

.endpoint-path {
  margin-left: 12px;
  text-transform: initial;
}

.deprecated {
  text-decoration: line-through;
}
</style>
