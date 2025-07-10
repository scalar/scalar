<script setup lang="ts">
import { getHttpMethodInfo } from '@scalar/helpers/http/http-info'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import { isOperationDeprecated } from '@scalar/oas-utils/helpers'
import type { TransformedOperation } from '@scalar/types/legacy'
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

// TODO in V2 we need to do the same loading trick as the initial load
const scrollHandler = async (
  givenOperation: Pick<TransformedOperation, 'id'>,
) => {
  scrollToOperation(givenOperation.id, true)
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
  'operation' in operation && isOperationDeprecated(operation.operation)

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
      <div class="flex min-w-[62px] flex-row items-center justify-end gap-2">
        <ScalarIconWebhooksLogo
          v-if="isWebhook(operation)"
          :style="{
            color: getHttpMethodInfo(operation.method).colorVar,
          }" />
        <HttpMethod
          class="endpoint-method min-w-0"
          :method="operation.method" />
      </div>
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
  display: inline-block;
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
