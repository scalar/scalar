<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { snippetz, type HarRequest } from '@scalar/snippetz'

const { content } = defineProps<{
  content: OpenAPIV3_1.Document
}>()

// TODO: Use the new store here.

const getRequestExample = (harRequest: Partial<HarRequest>) => {
  const snippet = snippetz().print('shell', 'curl', {
    httpVersion: 'HTTP/1.1',
    headers: [],
    queryString: [],
    cookies: [],
    headersSize: -1,
    bodySize: -1,
    method: 'get',
    ...harRequest,
  })

  return snippet
}
</script>

<template>
  <h1>{{ content?.info?.title }}</h1>

  <p>
    <strong>OpenAPI:</strong> {{ content?.openapi }}<br />
    <strong>Version:</strong> {{ content?.info?.version }}
  </p>

  <!-- <ScalarMarkdown
    :value="content?.info?.description"
    v-if="content?.info?.description" /> -->

  <template v-if="content?.servers?.length">
    <h2>Servers</h2>
    <ul>
      <li
        v-for="(server, index) in content.servers"
        :key="index">
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
                <code>'{{ variable.default }}'</code>)<span
                  v-if="variable.description"
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
        <h3>
          <template v-if="operation.summary">
            {{ operation.summary }}
          </template>
          <template v-else>
            {{ method.toString().toUpperCase() }} {{ path }}
          </template>
          <template v-if="operation['x-scalar-stability']">
            ({{ operation['x-scalar-stability'] }})
          </template>
          <template v-else-if="operation.deprecated"> (deprecated) </template>
        </h3>

        <p v-if="operation.summary">
          <strong>Method:</strong>
          {{ method.toString().toUpperCase() }}<br />
          <strong>Path:</strong>
          {{ path }}
        </p>

        <ScalarMarkdown :value="operation.description" />

        <pre><code>{{ getRequestExample({
          method: method.toString(),
          url: content.servers?.[0]?.url + path,
        }) }}</code></pre>
      </template>
    </template>
  </template>

  <template
    v-if="
      content?.components?.schemas &&
      Object.keys(content.components.schemas).length
    ">
    <h2>Schemas</h2>
    <template
      v-for="(schema, name) in content.components.schemas"
      :key="name">
      <h3>{{ name }}</h3>
      <template v-if="schema.description">
        <ScalarMarkdown :value="schema.description" />
      </template>
      <pre
        v-if="
          schema.type === 'object'
        "><code>{{ JSON.stringify(schema, null, 2) }}</code></pre>
    </template>
  </template>
</template>
