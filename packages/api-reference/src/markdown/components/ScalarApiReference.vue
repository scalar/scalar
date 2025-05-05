<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { normalize } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import {
  apiReferenceConfigurationSchema,
  type ApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import { computed } from 'vue'

const { configuration } = defineProps<{
  configuration: Partial<ApiReferenceConfiguration>
}>()

const parsedConfiguration = computed(() =>
  apiReferenceConfigurationSchema.parse(configuration),
)

// TODO: We can't assume it's always OpenAPI 3.1 and always content, we need the new store here. :)
const content = computed<OpenAPIV3_1.Document>(() =>
  // @ts-expect-error whatever
  normalize(parsedConfiguration.value.content),
)
</script>

<template>
  <h1>{{ content?.info?.title }} ({{ content?.info?.version }})</h1>

  <p>OpenAPI {{ content?.openapi }}</p>

  <ScalarMarkdown
    :value="content?.info?.description"
    v-if="content?.info?.description" />

  <template v-if="content?.servers?.length">
    <h2>Servers</h2>
    <ul>
      <li
        v-for="server in content.servers"
        :key="server.url">
        <strong>URL:</strong> <code>{{ server.url }}</code>
        <ul>
          <li v-if="server.description">
            <strong>Description:</strong> {{ server.description }}
          </li>
          <li v-if="server.variables && Object.keys(server.variables).length">
            <strong>Variables:</strong>
            <ul>
              <li
                v-for="(variable, name) in server.variables"
                :key="name">
                <code>{{ name }}</code> (default:
                <code>{{ variable.default }}</code
                >)<span v-if="variable.description"
                  >: {{ variable.description }}</span
                >
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </template>

  <template v-if="Object.keys(content?.paths ?? {}).length">
    <h2>Operations</h2>

    <template
      v-for="path in Object.keys(content?.paths ?? {})"
      :key="path">
      <template
        v-for="(operation, method) in content?.paths?.[path]"
        :key="operation">
        <h3>{{ method.toString().toUpperCase() }} {{ path }}</h3>

        <ScalarMarkdown :value="operation.summary" />
        <ScalarMarkdown :value="operation.description" />
      </template>
    </template>
  </template>
</template>
