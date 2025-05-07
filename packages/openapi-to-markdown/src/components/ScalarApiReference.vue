<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { snippetz, type HarRequest } from '@scalar/snippetz'

import SchemaRenderer from './SchemaRenderer.vue'

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
          <template v-else-if="operation.deprecated">
            <span class="deprecated">(deprecated)</span>
          </template>
        </h3>

        <div class="operation-details">
          <table>
            <tbody>
              <tr>
                <th>Method</th>
                <td>
                  <code>{{ method.toString().toUpperCase() }}</code>
                </td>
              </tr>
              <tr>
                <th>Path</th>
                <td>
                  <code>{{ path }}</code>
                </td>
              </tr>
              <template v-if="operation.tags">
                <tr>
                  <th>Tags</th>
                  <td>{{ operation.tags.join(', ') }}</td>
                </tr>
              </template>
              <template v-if="operation.deprecated">
                <tr>
                  <th>Deprecated</th>
                  <td>true</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <ScalarMarkdown :value="operation.description" />

        <h4>Request Example</h4>
        <pre><code>{{ getRequestExample({
            method: method.toString(),
            url: content.servers?.[0]?.url + path,
          }) }}</code></pre>

        <template v-if="operation.responses">
          <h4>Responses</h4>

          <template
            v-for="(response, statusCode) in operation.responses"
            :key="statusCode">
            <h5>Status: {{ statusCode }}</h5>
            <h6>Code: {{ statusCode }}</h6>

            <pre><code>{{ JSON.stringify(response, null, 2) }}</code></pre>
          </template>
        </template>
      </template>
    </template>
  </template>

  <template v-if="Object.keys(content?.webhooks ?? {}).length">
    <h2>Webhooks</h2>

    <template
      v-for="(webhook, name) in content?.webhooks"
      :key="name">
      <template
        v-for="(operation, method) in webhook"
        :key="operation">
        <h3>
          <template v-if="operation.summary">
            {{ operation.summary }}
          </template>
          <template v-else>
            {{ name }}
          </template>
          <template v-if="operation['x-scalar-stability']">
            ({{ operation['x-scalar-stability'] }})
          </template>
          <template v-else-if="operation.deprecated">
            <span class="deprecated">(deprecated)</span>
          </template>
        </h3>

        <div class="operation-details">
          <table>
            <tbody>
              <tr>
                <th>Method</th>
                <td>
                  <code>{{ method.toString().toUpperCase() }}</code>
                </td>
              </tr>
              <tr>
                <th>Path</th>
                <td>
                  <code>/webhooks/{{ name }}</code>
                </td>
              </tr>
              <template v-if="operation.tags">
                <tr>
                  <th>Tags</th>
                  <td>{{ operation.tags.join(', ') }}</td>
                </tr>
              </template>
              <template v-if="operation.deprecated">
                <tr>
                  <th>Deprecated</th>
                  <td>true</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <ScalarMarkdown :value="operation.description" />

        <div class="request-example">
          <h4>Request Example</h4>
          <pre><code>{{ getRequestExample({
            method: method.toString(),
            url: content.servers?.[0]?.url + '/webhooks/' + name,
          }) }}</code></pre>
        </div>
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
      <h3>{{ schema.title ?? name }}</h3>
      <p>
        Type: <code>{{ schema.type }}</code>
      </p>
      <template v-if="schema.description">
        <ScalarMarkdown :value="schema.description" />
      </template>
      <SchemaRenderer
        v-if="schema.type === 'object'"
        :schema="schema" />
    </template>
  </template>
</template>

<style scoped>
.schema-container {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: #f9fafb;
}

.schema-properties {
  list-style: none;
  padding-left: 1rem;
}

.schema-property {
  margin: 0.5rem 0;
  padding: 0.5rem;
  border-left: 2px solid #e5e7eb;
}

.schema-description {
  color: #6b7280;
  margin: 0.25rem 0;
}

.schema-type,
.schema-format,
.schema-enum,
.schema-default {
  margin: 0.25rem 0;
  color: #4b5563;
}

.operation-details {
  margin: 1rem 0;
}

.operation-details table {
  border-collapse: collapse;
  width: 100%;
  max-width: 600px;
}

.operation-details th,
.operation-details td {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.operation-details th {
  background-color: #f9fafb;
  font-weight: 600;
  width: 120px;
}

.request-example,
.response-example {
  margin: 1rem 0;
}

.request-example h4,
.response-example h4 {
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.deprecated {
  color: #dc2626;
  font-size: 0.875em;
  margin-left: 0.5rem;
}

pre {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875em;
}
</style>
