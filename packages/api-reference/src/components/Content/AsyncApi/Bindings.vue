<script setup lang="ts">
import { Schema } from '@scalar/blocks/schema'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { computed } from 'vue'

import {
  resolveSchemaRenderOptions,
  type AsyncApiSchemaRenderOptions,
} from './helpers/async-api-render-options'
import { getBindingEntries } from './helpers/get-binding-entries'
import type { BindingScope } from './helpers/get-binding-schema'

const { bindings, scope, options } = defineProps<{
  bindings?: unknown
  options?: Partial<AsyncApiSchemaRenderOptions>
  scope?: BindingScope
}>()
const schemaOptions = computed(() => ({
  hideReadOnly: false,
  ...resolveSchemaRenderOptions(options),
}))
const entries = computed(() => getBindingEntries(bindings, scope))
</script>

<template>
  <div
    v-if="entries.length"
    class="min-w-0 space-y-3 text-sm">
    <div class="bindings-heading text-c-1 text-base leading-[1.45] font-medium">
      Bindings
    </div>
    <div
      v-for="entry in entries"
      :key="entry.name"
      class="min-w-0 space-y-2">
      <div class="text-c-2 font-code text-sm break-all">
        {{ entry.name }}
      </div>
      <dl v-if="entry.fields.length">
        <div
          v-for="field in entry.fields"
          :key="field.name"
          class="min-w-0"
          :class="{
            'font-code flex flex-wrap items-baseline gap-x-[9px] text-(length:--scalar-mini) leading-[1.625]':
              !field.schema && !field.nested,
          }">
          <template v-if="field.schema">
            <dt class="sr-only">{{ field.name }}</dt>
            <dd>
              <Schema
                compact
                :eventBus="null"
                :name="field.name"
                noncollapsible
                :options="schemaOptions"
                :schema="{
                  type: 'object',
                  properties: { [field.name]: field.schema },
                }" />
            </dd>
          </template>
          <template v-else-if="!field.nested">
            <dt
              class="text-c-1 py-1.5 text-(length:--scalar-font-size-4) [font-weight:var(--scalar-bold)] break-all">
              {{ field.name }}
            </dt>
            <dd class="text-c-2 py-1.5 break-all whitespace-pre-wrap">
              {{ field.content }}
            </dd>
          </template>
          <template v-else>
            <dt class="sr-only">{{ field.name }}</dt>
            <dd>
              <details>
                <summary
                  class="text-c-1 font-code cursor-pointer rounded py-1.5 text-(length:--scalar-font-size-4) [font-weight:var(--scalar-bold)] break-all focus-visible:outline">
                  {{ field.name }}
                </summary>
                <div class="mt-2 max-h-80 overflow-auto">
                  <ScalarCodeBlock
                    :content="field.content"
                    lang="json" />
                </div>
              </details>
            </dd>
          </template>
        </div>
      </dl>
      <p
        v-else
        class="text-c-2 py-2">
        No additional fields.
      </p>
    </div>
  </div>
</template>
