<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import { ScalarIconCaretRight, ScalarIconTagChevron } from '@scalar/icons'
import {
  requestSchema,
  type Collection,
  type Server,
} from '@scalar/oas-utils/entities/spec'
import { schemaModel } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1, TransformedOperation } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

import { HttpMethod } from '@/components/HttpMethod'
import OperationPath from '@/components/OperationPath.vue'
import { SectionColumn, SectionColumns } from '@/components/Section'
import { ExampleRequest } from '@/features/ExampleRequest'
import { ExampleResponses } from '@/features/ExampleResponses'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'
import type { Schemas } from '@/features/Operation/types/schemas'

const { callback, collection, method, parentId, schemas, server, url } =
  defineProps<{
    callback: OpenAPIV3_1.OperationObject
    collection: Collection
    method: string
    parentId: string
    schemas?: Schemas
    server: Server | undefined
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

const open = ref(false)
</script>

<template>
  <div v-if="collection && operation">
    <!-- Title -->
    <div
      @click.stop="open = !open"
      class="font-code text-c-1 text-md group flex cursor-pointer flex-row items-center gap-2 font-medium">
      <ScalarIconCaretRight
        class="text-c-3 group-hover:text-c-1 absolute -left-5 transition-transform"
        :class="{ 'rotate-90': open }" />
      {{ url }}
      <HttpMethod
        as="span"
        class="request-method"
        :method="method" />
    </div>

    <!-- Body -->
    <div
      class="flex flex-col gap-2"
      v-if="open">
      <SectionColumns>
        <SectionColumn>
          <!-- Body -->
          <OperationParameters
            :operation="operation"
            :schemas="schemas" />

          <!-- Responses -->
          <OperationResponses
            :operation="transformedOperation"
            :schemas="schemas" />
        </SectionColumn>

        <!-- Examples -->
        <SectionColumn>
          <!-- <div class="examples">
            <ScalarErrorBoundary>
              <ExampleRequest
                :collection="collection"
                fallback
                :operation="operation"
                :server="server"
                :transformedOperation="transformedOperation">
                <template #header>
                  <OperationPath
                    class="example-path"
                    :path="transformedOperation.path" />
                </template>
              </ExampleRequest>
            </ScalarErrorBoundary>

            <ScalarErrorBoundary>
              <ExampleResponses
                :responses="operation.responses"
                style="margin-top: 12px" />
            </ScalarErrorBoundary>
          </div> -->
        </SectionColumn>
      </SectionColumns>
    </div>
  </div>
</template>
