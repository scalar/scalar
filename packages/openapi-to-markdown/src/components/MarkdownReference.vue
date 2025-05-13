<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

// import { snippetz, type HarRequest } from '@scalar/snippetz'

import Schema from './Schema.vue'
import XmlOrJson from './XmlOrJson.vue'

const { content } = defineProps<{
  content: OpenAPIV3_1.Document
}>()

// const getRequestExample = (harRequest: Partial<HarRequest>) => {
//   const snippet = snippetz().print('shell', 'curl', {
//     httpVersion: 'HTTP/1.1',
//     headers: [],
//     queryString: [],
//     cookies: [],
//     headersSize: -1,
//     bodySize: -1,
//     method: 'get',
//     ...harRequest,
//   })

//   return snippet
// }
</script>

<template>
  <section>
    <header>
      <h1>{{ content?.info?.title }}</h1>
      <ul>
        <li>
          <strong>OpenAPI Version:</strong>&nbsp;<code>{{
            content?.openapi
          }}</code>
        </li>
        <li>
          <strong>API Version:</strong>&nbsp;<code>{{
            content?.info?.version
          }}</code>
        </li>
      </ul>
    </header>

    <ScalarMarkdown
      :value="content?.info?.description"
      v-if="content?.info?.description" />

    <section v-if="content?.servers?.length">
      <h2>Servers</h2>
      <ul>
        <template
          v-for="server in content.servers"
          :key="server.url">
          <li>
            <strong>URL:</strong>&nbsp;<code>{{ server.url }}</code>
            <ul>
              <template v-if="server.description">
                <li>
                  <strong>Description:</strong>&nbsp;{{ server.description }}
                </li>
              </template>
              <template
                v-if="server.variables && Object.keys(server.variables).length">
                <li>
                  <strong>Variables:</strong>
                  <ul>
                    <template
                      v-for="(variable, name) in server.variables"
                      :key="name">
                      <li>
                        <code>{{ name }}</code> (default:
                        <code>{{ variable.default }}</code
                        >)<template v-if="variable.description"
                          >: {{ variable.description }}
                        </template>
                      </li>
                    </template>
                  </ul>
                </li>
              </template>
            </ul>
          </li>
        </template>
      </ul>
    </section>

    <section v-if="Object.keys(content?.paths ?? {}).length">
      <h2>Operations</h2>

      <template
        v-for="path in Object.keys(content?.paths ?? {})"
        :key="path">
        <template
          v-for="(operation, method) in content?.paths?.[path]"
          :key="operation">
          <section>
            <header>
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
                  ⚠️ Deprecated
                </template>
              </h3>
            </header>

            <ul>
              <li>
                <strong>Method:</strong>&nbsp;<code>{{
                  method.toString().toUpperCase()
                }}</code>
              </li>
              <li>
                <strong>Path:</strong>&nbsp;<code>{{ path }}</code>
              </li>
              <template v-if="operation.tags">
                <li>
                  <strong>Tags:</strong>&nbsp;{{ operation.tags.join(', ') }}
                </li>
              </template>
              <template v-if="operation['x-scalar-stability']">
                <li>
                  <strong>Stability:</strong>&nbsp;{{
                    operation['x-scalar-stability']
                  }}
                </li>
              </template>
            </ul>

            <ScalarMarkdown :value="operation.description" />

            <!-- TODO: We need way more context to generate proper request examples -->
            <!-- <section>
              <h4>Request Example</h4>
              <pre><code>{{ getRequestExample({
                method: method.toString(),
                url: content.servers?.[0]?.url + path,
              }) }}</code></pre>
            </section> -->

            <template v-if="operation.requestBody?.content">
              <section>
                <h4>Request Body</h4>
                <template
                  v-for="(content, mediaType) in operation.requestBody.content"
                  :key="mediaType">
                  <h5>Content-Type: {{ mediaType }}</h5>
                  <template v-if="content.schema">
                    <Schema :schema="content.schema" />
                    <p><strong>Example:</strong></p>
                    <XmlOrJson
                      :xml="mediaType?.toString().includes('xml')"
                      :model-value="
                        getExampleFromSchema(content.schema, {
                          xml: mediaType?.toString().includes('xml'),
                        })
                      " />
                  </template>
                </template>
              </section>
            </template>

            <template v-if="operation.responses">
              <section>
                <h4>Responses</h4>

                <template
                  v-for="(response, statusCode) in operation.responses"
                  :key="statusCode">
                  <section>
                    <header>
                      <h5>
                        Status: {{ statusCode }}
                        <template v-if="response.description">
                          {{ response.description }}
                        </template>
                      </h5>
                    </header>
                    <template
                      v-for="(content, mediaType) in response.content"
                      :key="mediaType">
                      <section>
                        <h6>Content-Type: {{ mediaType }}</h6>
                        <template v-if="content.schema">
                          <Schema :schema="content.schema" />
                          <p><strong>Example:</strong></p>
                          <XmlOrJson
                            :xml="mediaType?.toString().includes('xml')"
                            :model-value="
                              getExampleFromSchema(content.schema, {
                                xml: mediaType?.toString().includes('xml'),
                              })
                            " />
                        </template>
                      </section>
                    </template>
                  </section>
                </template>
              </section>
            </template>
          </section>
        </template>
      </template>
    </section>

    <section v-if="Object.keys(content?.webhooks ?? {}).length">
      <h2>Webhooks</h2>

      <template
        v-for="(webhook, name) in content?.webhooks"
        :key="name">
        <template
          v-for="(operation, method) in webhook"
          :key="operation">
          <section>
            <header>
              <h3>
                <template v-if="operation.summary">
                  {{ operation.summary }}
                </template>
                <template v-else>
                  {{ name }}
                </template>
                <template v-if="operation['x-scalar-stability']">
                  <span>({{ operation['x-scalar-stability'] }})</span>
                </template>
                <template v-else-if="operation.deprecated">
                  <span>⚠️ Deprecated</span>
                </template>
              </h3>
            </header>

            <ul>
              <li>
                <strong>Method:</strong>
                <code>{{ method.toString().toUpperCase() }}</code>
              </li>
              <li>
                <strong>Path:</strong>
                <code>/webhooks/{{ name }}</code>
              </li>
              <template v-if="operation.tags">
                <li>
                  <strong>Tags:</strong>
                  {{ operation.tags.join(', ') }}
                </li>
              </template>
              <template v-if="operation.deprecated">
                <li><strong>Deprecated</strong></li>
              </template>
            </ul>

            <ScalarMarkdown :value="operation.description" />

            <!-- TODO: We need way more context to generate proper request examples -->
            <!-- <section>
              <h4>Request Example</h4>
              <pre><code>{{ getRequestExample({
                method: method.toString(),
                url: content.servers?.[0]?.url + '/webhooks/' + name,
              }) }}</code></pre>
            </section> -->
          </section>
        </template>
      </template>
    </section>

    <section
      v-if="
        content?.components?.schemas &&
        Object.keys(content.components.schemas).length
      ">
      <h2>Schemas</h2>
      <template
        v-for="(schema, name) in content.components.schemas"
        :key="name">
        <section>
          <header>
            <h3>{{ schema.title ?? name }}</h3>
          </header>
          <ul>
            <li>
              <strong>Type:</strong>
              <code>{{ schema.type }}</code>
            </li>
          </ul>
          <template v-if="schema.description">
            <ScalarMarkdown :value="schema.description" />
          </template>
          <Schema
            v-if="schema.type === 'object'"
            :schema="schema" />
          <p><strong>Example:</strong></p>
          <template v-if="schema.type === 'object'">
            <XmlOrJson :model-value="getExampleFromSchema(schema)" />
          </template>
        </section>
      </template>
    </section>
  </section>
</template>
