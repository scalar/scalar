<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type {
  OpenApiDocument,
  OperationObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

// import { snippetz, type HarRequest } from '@scalar/snippetz'

import Schema from './Schema.vue'
import XmlOrJson from './XmlOrJson.vue'

type MarkdownDocument = Partial<OpenApiDocument> &
  Pick<OpenApiDocument, 'openapi' | 'info'>
type SchemaView = {
  description?: string
  title?: string
  type?: string | string[]
}
type RequestBodyView = {
  content?: Record<string, { schema?: unknown }>
}
type ResponseView = {
  description?: string
  content?: Record<string, { schema?: unknown }>
}

type OperationEntry = {
  path: string
  method: string
  operation: OperationObject
  requestBody: RequestBodyView | null
  responses: Array<{
    statusCode: string
    response: ResponseView
  }>
}

const { content } = defineProps<{
  content: MarkdownDocument
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

const resolveRefAs = <TResolved extends object>(
  reference: unknown,
): TResolved | null => {
  const resolved = getResolvedRef(reference as never)

  return resolved && typeof resolved === 'object'
    ? (resolved as TResolved)
    : null
}

const resolveOperation = (operation: unknown): OperationObject | null =>
  resolveRefAs<OperationObject>(operation)

const resolveSchema = (schema: unknown): SchemaObject | null =>
  resolveRefAs<SchemaObject>(schema)

const resolveRequestBody = (body: unknown): RequestBodyObject | null =>
  resolveRefAs<RequestBodyObject>(body)

const resolveResponse = (response: unknown): ResponseObject | null =>
  resolveRefAs<ResponseObject>(response)

const toRequestBodyView = (body: unknown): RequestBodyView | null =>
  resolveRequestBody(body) as unknown as RequestBodyView | null

const toResponseView = (response: unknown): ResponseView | null =>
  resolveResponse(response) as unknown as ResponseView | null

const HTTP_METHODS = new Set([
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
])

const operations = computed<OperationEntry[]>(() => {
  const paths = content?.paths ?? {}

  return Object.entries(paths).flatMap(([path, pathItem]) => {
    if (!pathItem || typeof pathItem !== 'object') {
      return []
    }

    return Object.entries(pathItem).flatMap(([method, operation]) => {
      if (!HTTP_METHODS.has(method)) {
        return []
      }

      const resolvedOperation = resolveOperation(operation)

      if (!resolvedOperation) {
        return []
      }

      const requestBody = toRequestBodyView(resolvedOperation.requestBody)
      const responses = Object.entries(
        resolvedOperation.responses ?? {},
      ).flatMap(([statusCode, response]) => {
        const resolvedResponse = toResponseView(response)

        if (!resolvedResponse) {
          return []
        }

        return [{ statusCode, response: resolvedResponse }]
      })

      return [
        {
          path,
          method,
          operation: resolvedOperation,
          requestBody,
          responses,
        },
      ]
    })
  })
})

const webhooks = computed(() => {
  const webhookItems = content?.webhooks ?? {}

  return Object.entries(webhookItems).flatMap(([name, pathItem]) => {
    if (!pathItem || typeof pathItem !== 'object') {
      return []
    }

    return Object.entries(pathItem).flatMap(([method, operation]) => {
      if (!HTTP_METHODS.has(method)) {
        return []
      }

      const resolvedOperation = resolveOperation(operation)

      if (!resolvedOperation) {
        return []
      }

      return [{ name, method, operation: resolvedOperation }]
    })
  })
})

const componentSchemas = computed(() => {
  const schemas = content?.components?.schemas ?? {}

  return Object.entries(schemas).flatMap(([name, schema]) => {
    const resolvedSchema = resolveSchema(schema)

    if (!resolvedSchema) {
      return []
    }

    return [{ name, schema: resolvedSchema }]
  })
})

const getSchemaView = (schema: SchemaObject): SchemaView =>
  schema as unknown as SchemaView
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
      v-if="content?.info?.description"
      :value="content?.info?.description" />

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

    <section v-if="operations.length">
      <h2>Operations</h2>

      <template
        v-for="entry in operations"
        :key="`${entry.method}:${entry.path}`">
        <section>
          <header>
            <h3>
              <template v-if="entry.operation.summary">
                {{ entry.operation.summary }}
              </template>
              <template v-else>
                {{ entry.method.toString().toUpperCase() }} {{ entry.path }}
              </template>
              <template v-if="entry.operation['x-scalar-stability']">
                ({{ entry.operation['x-scalar-stability'] }})
              </template>
              <template v-else-if="entry.operation.deprecated">
                ⚠️ Deprecated
              </template>
            </h3>
          </header>

          <ul>
            <li>
              <strong>Method:</strong>&nbsp;<code>{{
                entry.method.toString().toUpperCase()
              }}</code>
            </li>
            <li>
              <strong>Path:</strong>&nbsp;<code>{{ entry.path }}</code>
            </li>
            <template v-if="entry.operation.tags">
              <li>
                <strong>Tags:</strong>&nbsp;{{
                  entry.operation.tags.join(', ')
                }}
              </li>
            </template>
            <template v-if="entry.operation['x-scalar-stability']">
              <li>
                <strong>Stability:</strong>&nbsp;{{
                  entry.operation['x-scalar-stability']
                }}
              </li>
            </template>
          </ul>

          <ScalarMarkdown :value="entry.operation.description" />

          <!-- TODO: We need way more context to generate proper request examples -->
          <!-- <section>
              <h4>Request Example</h4>
              <pre><code>{{ getRequestExample({
                method: method.toString(),
                url: content.servers?.[0]?.url + path,
              }) }}</code></pre>
            </section> -->

          <template v-if="entry.requestBody?.content">
            <section>
              <h4>Request Body</h4>
              <template
                v-for="(bodyContent, mediaType) in entry.requestBody.content"
                :key="mediaType">
                <h5>Content-Type: {{ mediaType }}</h5>
                <template v-if="resolveSchema(bodyContent.schema)">
                  <Schema :schema="resolveSchema(bodyContent.schema)!" />
                  <p><strong>Example:</strong></p>
                  <XmlOrJson
                    :modelValue="
                      getExampleFromSchema(resolveSchema(bodyContent.schema)!, {
                        xml: mediaType?.toString().includes('xml'),
                      })
                    "
                    :xml="mediaType?.toString().includes('xml')" />
                </template>
              </template>
            </section>
          </template>

          <template v-if="entry.responses.length">
            <section>
              <h4>Responses</h4>

              <template
                v-for="entryResponse in entry.responses"
                :key="entryResponse.statusCode">
                <section>
                  <header>
                    <h5>
                      Status: {{ entryResponse.statusCode }}
                      <template v-if="entryResponse.response.description">
                        {{ entryResponse.response.description }}
                      </template>
                    </h5>
                  </header>
                  <template v-if="entryResponse.response.content">
                    <template
                      v-for="(responseContent, mediaType) in entryResponse
                        .response.content"
                      :key="mediaType">
                      <section>
                        <h6>Content-Type: {{ mediaType }}</h6>
                        <template v-if="resolveSchema(responseContent.schema)">
                          <Schema
                            :schema="resolveSchema(responseContent.schema)!" />
                          <p><strong>Example:</strong></p>
                          <XmlOrJson
                            :modelValue="
                              getExampleFromSchema(
                                resolveSchema(responseContent.schema)!,
                                {
                                  xml: mediaType?.toString().includes('xml'),
                                },
                              )
                            "
                            :xml="mediaType?.toString().includes('xml')" />
                        </template>
                      </section>
                    </template>
                  </template>
                </section>
              </template>
            </section>
          </template>
        </section>
      </template>
    </section>

    <section v-if="webhooks.length">
      <h2>Webhooks</h2>

      <template
        v-for="webhook in webhooks"
        :key="`${webhook.name}:${webhook.method}`">
        <section>
          <header>
            <h3>
              <template v-if="webhook.operation.summary">
                {{ webhook.operation.summary }}
              </template>
              <template v-else>
                {{ webhook.name }}
              </template>
              <template v-if="webhook.operation['x-scalar-stability']">
                <span>({{ webhook.operation['x-scalar-stability'] }})</span>
              </template>
              <template v-else-if="webhook.operation.deprecated">
                <span>⚠️ Deprecated</span>
              </template>
            </h3>
          </header>

          <ul>
            <li>
              <strong>Method:</strong>
              <code>{{ webhook.method.toString().toUpperCase() }}</code>
            </li>
            <li>
              <strong>Path:</strong>
              <code>/webhooks/{{ webhook.name }}</code>
            </li>
            <template v-if="webhook.operation.tags">
              <li>
                <strong>Tags:</strong>
                {{ webhook.operation.tags.join(', ') }}
              </li>
            </template>
            <template v-if="webhook.operation.deprecated">
              <li><strong>Deprecated</strong></li>
            </template>
          </ul>

          <ScalarMarkdown :value="webhook.operation.description" />

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
    </section>

    <section v-if="componentSchemas.length">
      <h2>Schemas</h2>
      <template
        v-for="entry in componentSchemas"
        :key="entry.name">
        <section>
          <header>
            <h3>{{ getSchemaView(entry.schema).title ?? entry.name }}</h3>
          </header>
          <ul>
            <li>
              <strong>Type:</strong>
              <code>{{ getSchemaView(entry.schema).type }}</code>
            </li>
          </ul>
          <template v-if="getSchemaView(entry.schema).description">
            <ScalarMarkdown :value="getSchemaView(entry.schema).description" />
          </template>
          <Schema
            v-if="getSchemaView(entry.schema).type === 'object'"
            :schema="entry.schema" />
          <p><strong>Example:</strong></p>
          <template v-if="getSchemaView(entry.schema).type === 'object'">
            <XmlOrJson :modelValue="getExampleFromSchema(entry.schema)" />
          </template>
        </section>
      </template>
    </section>
  </section>
</template>
