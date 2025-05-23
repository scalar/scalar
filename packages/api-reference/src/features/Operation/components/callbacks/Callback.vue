<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { requestSchema, type Collection } from '@scalar/oas-utils/entities/spec'
import { schemaModel } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1, TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'
import type { Schemas } from '@/features/Operation/types/schemas'

const { callback, collection, method, name, schemas, url } = defineProps<{
  callback: OpenAPIV3_1.OperationObject
  collection: Collection
  method: string
  name: string
  schemas?: Schemas
  url: string
}>()

/** This should get us 90% of the way there, will fix the rest on new store */
const operation = computed(() =>
  schemaModel({ ...callback, path: url, method }, requestSchema, false),
)

const transformedOperation = computed(
  () =>
    ({
      ...callback,
      httpVerb: method as TransformedOperation['httpVerb'],
      path: url,
      information: {
        responses: callback.responses,
      },
    }) satisfies TransformedOperation,
)
</script>

<template>
  <details
    v-if="collection && operation"
    class="group py-3">
    <!-- Title -->
    <summary
      class="font-code flex cursor-pointer flex-row items-center gap-2 text-sm group-open:flex-wrap">
      <ScalarIconCaretRight
        class="text-c-3 group-hover:text-c-1 absolute -left-5 size-4 transition-transform group-open:rotate-90" />
      <HttpMethod
        as="span"
        class="request-method"
        :method="method" />
      <div class="text-c-1 truncate leading-3 group-open:whitespace-normal">
        {{ name }}
        <span class="text-c-2">
          {{ url }}
        </span>
      </div>
    </summary>

    <!-- Body -->
    <div class="open:bg-blue flex flex-col gap-2">
      <OperationParameters
        :operation="operation"
        :schemas="schemas" />

      <!-- Responses -->
      <OperationResponses
        :operation="transformedOperation"
        :schemas="schemas" />
    </div>
  </details>
</template>
