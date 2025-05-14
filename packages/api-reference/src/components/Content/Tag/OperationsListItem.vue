<script setup lang="ts">
import { useWorkspace } from '@scalar/api-client/store'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import type { Tag, TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

import { getPointer } from '@/blocks/helpers/getPointer'
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import { HttpMethod } from '@/components/HttpMethod'
import { SectionHeaderTag } from '@/components/Section'
import { useNavState } from '@/hooks/useNavState'
import { useSidebar } from '@/hooks/useSidebar'
import { isOperationDeprecated } from '@/libs/openapi'

const { transformedOperation, tag, collection } = defineProps<{
  transformedOperation: TransformedOperation
  tag: Tag
  collection: Collection
  isCollapsed?: boolean
}>()

const { getOperationId } = useNavState()
const { scrollToOperation } = useSidebar()

// TODO in V2 we need to do the same loading trick as the initial load
const scrollHandler = async (givenOperation: TransformedOperation) => {
  const operationId = getOperationId(givenOperation, tag)
  scrollToOperation(operationId, true)
}

const store = useWorkspace()

/**
 * Resolve the matching operation from the store
 *
 * TODO: In the future, we won’t need this.
 *
 * We’ll be able to just use the request entitiy from the store directly, once we loop over those,
 * instead of using the super custom transformed `parsedSpec` that we’re using now.
 */
const { operation } = useBlockProps({
  store,
  collection,
  location: getPointer([
    'paths',
    transformedOperation.path,
    transformedOperation.httpVerb.toLowerCase(),
  ]),
})

/** The title of the operation (summary or path) */
const title = computed(() => operation.value?.summary || operation.value?.path)
</script>

<template>
  <li
    v-if="operation"
    :key="getOperationId(transformedOperation, tag)"
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
      :href="`#${getOperationId(transformedOperation, tag)}`"
      @click.prevent="scrollHandler(transformedOperation)">
      <HttpMethod
        class="endpoint-method"
        :method="operation.method" />
      <span
        class="endpoint-path"
        :class="{
          deprecated: isOperationDeprecated(operation),
        }">
        {{ operation.path }}
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
.endpoint span:first-of-type {
  text-transform: uppercase;
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
