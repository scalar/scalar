<script setup lang="ts">
import { getHttpMethodInfo } from '@scalar/helpers/http/http-info'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { isOperationDeprecated } from '@scalar/oas-utils/helpers'
import type {
  OpenAPIV3_1,
  TransformedOperation,
  XScalarStability,
} from '@scalar/types/legacy'
import { computed } from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import { SectionHeaderTag } from '@/components/Section'
import { useSidebar } from '@/features/sidebar'

const { transformedOperation } = defineProps<{
  transformedOperation: TransformedOperation
  collection: Collection
  isCollapsed?: boolean
}>()

const { scrollToOperation } = useSidebar()

// TODO in V2 we need to do the same loading trick as the initial load
const scrollHandler = async (givenOperation: TransformedOperation) => {
  scrollToOperation(givenOperation.id, true)
}

/** The title of the operation (summary or path) */
const title = computed(
  () => transformedOperation?.name || transformedOperation?.path,
)
</script>

<template>
  <li
    :key="transformedOperation.id"
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
      :href="`#${transformedOperation.id}`"
      @click.prevent="scrollHandler(transformedOperation)">
      <HttpMethod
        class="endpoint-method items-center justify-end gap-2"
        :method="transformedOperation.httpVerb">
        <ScalarIconWebhooksLogo
          v-if="transformedOperation.isWebhook"
          class="size-3.5" />
      </HttpMethod>
      <span
        class="endpoint-path"
        :class="{
          deprecated: isOperationDeprecated(
            transformedOperation.information as OpenAPIV3_1.OperationObject<{
              'x-scalar-stability': XScalarStability
            }>,
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
