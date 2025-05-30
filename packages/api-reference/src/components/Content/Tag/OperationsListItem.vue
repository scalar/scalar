<script setup lang="ts">
import { useWorkspace } from '@scalar/api-client/store'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import type {
  OpenAPIV3_1,
  Tag,
  TransformedOperation,
} from '@scalar/types/legacy'
import { computed } from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import {
  requestMethodColors,
  type RequestMethod,
} from '@/components/HttpMethod/constants'
import { SectionHeaderTag } from '@/components/Section'
import { useSidebar } from '@/features/Sidebar'
import { operationIdParams } from '@/features/Sidebar/helpers/operation-id-params'
import { useNavState } from '@/hooks/useNavState'
import { isOperationDeprecated } from '@/libs/openapi'

const { transformedOperation, tag } = defineProps<{
  transformedOperation: TransformedOperation
  tag: Tag
  collection: Collection
  isCollapsed?: boolean
}>()

const { getOperationId, getWebhookId } = useNavState()
const { scrollToOperation } = useSidebar()

const operationId = computed(() => {
  if (transformedOperation.isWebhook) {
    return getWebhookId(
      {
        name: transformedOperation.path,
        method: transformedOperation.httpVerb.toLowerCase(),
      },
      tag,
    )
  }
  return getOperationId(operationIdParams(transformedOperation), tag)
})

/** The title of the operation (summary or path) */
const title = computed(
  () => transformedOperation?.name || transformedOperation?.path,
)
</script>

<template>
  <li
    v-if="transformedOperation"
    :key="operationId"
    class="contents">
    <!-- If collapsed add hidden headers so they show up for screen readers -->
    <SectionHeaderTag
      v-if="isCollapsed"
      class="sr-only"
      :level="3">
      {{ title }} (Hidden)
    </SectionHeaderTag>
    <a
      class="endpoint"
      :href="`#${operationId}`"
      @click.prevent="scrollToOperation(operationId, true)">
      <div class="flex min-w-[62px] flex-row items-center justify-end gap-2">
        <ScalarIconWebhooksLogo
          v-if="transformedOperation.isWebhook"
          :style="{
            color:
              requestMethodColors[
                transformedOperation.httpVerb.toUpperCase() as RequestMethod
              ] ?? 'var(--scalar-color-ghost)',
          }" />
        <HttpMethod
          class="endpoint-method min-w-0"
          :method="transformedOperation.httpVerb" />
      </div>

      <span
        class="endpoint-path"
        :class="{
          deprecated: isOperationDeprecated(
            transformedOperation.information ?? {},
          ),
        }">
        {{ transformedOperation.path }}
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
