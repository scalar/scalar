<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { computed } from 'vue'

import { getBindingEntries } from './helpers/get-binding-entries'

const { bindings } = defineProps<{ bindings?: unknown }>()
const entries = computed(() => getBindingEntries(bindings))
</script>

<template>
  <div
    v-if="entries.length"
    class="min-w-0 space-y-3 text-sm">
    <div class="text-c-1 font-medium">Bindings</div>
    <div
      v-for="entry in entries"
      :key="entry.name"
      class="min-w-0 rounded-lg border">
      <div class="bg-b-2 text-c-1 font-code rounded-t-lg px-3 py-2 break-all">
        {{ entry.name }}
      </div>
      <dl
        v-if="entry.fields.length"
        class="divide-y">
        <div
          v-for="field in entry.fields"
          :key="field.name"
          class="min-w-0 px-3 py-2">
          <template v-if="!field.nested">
            <dt class="text-c-2 font-code break-all">{{ field.name }}</dt>
            <dd class="text-c-1 font-code mt-1 break-all whitespace-pre-wrap">
              {{ field.content }}
            </dd>
          </template>
          <template v-else>
            <dt class="sr-only">{{ field.name }}</dt>
            <dd>
              <details>
                <summary
                  class="text-c-2 font-code cursor-pointer rounded break-all focus-visible:outline">
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
        class="text-c-2 px-3 py-2">
        No additional fields.
      </p>
    </div>
  </div>
</template>
