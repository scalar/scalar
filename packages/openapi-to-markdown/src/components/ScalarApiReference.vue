<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { snippetz, type HarRequest } from '@scalar/snippetz'

import SchemaRenderer from './SchemaRenderer.vue'

const { content } = defineProps<{
  content: OpenAPIV3_1.Document
}>()

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
            <h5>
              Status: {{ statusCode }}
              <template v-if="response.description">
                {{ response.description }}
              </template>
            </h5>
            <template
              v-for="(content, mediaType) in response.content"
              :key="mediaType">
              <h6>Content-Type: {{ mediaType }}</h6>
              <template v-if="content.schema">
                <SchemaRenderer :schema="content.schema" />
              </template>
            </template>
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
