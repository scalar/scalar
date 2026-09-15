<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import {
  forEachPathItemOperation,
  getResolvedPathItem,
} from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  EncodingObject,
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

// import { snippetz, type HarRequest } from '@scalar/snippetz'

import type { ExampleSource } from '../helpers/get-markdown-examples'
import Encoding from './Encoding.vue'
import Examples from './Examples.vue'
import Headers from './Headers.vue'
import ResponseLinks from './ResponseLinks.vue'
import Schema from './Schema.vue'

type MarkdownDocument = Partial<OpenApiDocument> &
  Pick<OpenApiDocument, 'openapi' | 'info'>
type SchemaView = {
  description?: string
  title?: string
  type?: string | string[]
}
type MediaTypeView = ExampleSource & {
  encoding?: Record<string, EncodingObject>
}
type RequestBodyView = {
  description?: string
  required?: boolean
  content?: Record<string, MediaTypeView>
}
type ParameterView = ExampleSource & {
  name: string
  in: string
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  allowReserved?: boolean
  style?: string
  explode?: boolean
  schema?: unknown
  content?: Record<string, MediaTypeView>
}
type ResponseView = {
  headers?: Record<string, unknown>
  links?: Record<string, unknown>
  description?: string
  content?: Record<string, MediaTypeView>
}

type OperationEntry = {
  path: string
  method: string
  operation: OperationObject
  parameters: ParameterView[]
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

const resolveSchema = (schema: unknown): SchemaObject | boolean | null => {
  const resolved = getResolvedRef<unknown>(schema)
  return typeof resolved === 'boolean'
    ? resolved
    : resolveRefAs<SchemaObject>(schema)
}

const resolveRequestBody = (body: unknown): RequestBodyObject | null =>
  resolveRefAs<RequestBodyObject>(body)

const resolveParameter = (parameter: unknown): ParameterObject | null =>
  resolveRefAs<ParameterObject>(parameter)

const resolveResponse = (response: unknown): ResponseObject | null =>
  resolveRefAs<ResponseObject>(response)

const toRequestBodyView = (body: unknown): RequestBodyView | null =>
  resolveRequestBody(body) as unknown as RequestBodyView | null

const toParameterView = (parameter: unknown): ParameterView | null => {
  const resolvedParameter = resolveParameter(parameter)

  if (!resolvedParameter) {
    return null
  }

  return resolvedParameter as unknown as ParameterView
}

const toResponseView = (response: unknown): ResponseView | null =>
  resolveResponse(response) as unknown as ResponseView | null

const getParameterKey = (parameter: ParameterView): string =>
  `${parameter.in}:${parameter.name}`

const getParameters = (
  pathParameters: unknown,
  operationParameters: unknown,
): ParameterView[] => {
  const parameters = new Map<string, ParameterView>()

  for (const parameterList of [pathParameters, operationParameters]) {
    if (!Array.isArray(parameterList)) {
      continue
    }

    for (const parameter of parameterList) {
      const parameterView = toParameterView(parameter)

      if (parameterView) {
        parameters.set(getParameterKey(parameterView), parameterView)
      }
    }
  }

  return Array.from(parameters.values())
}

const operations = computed<OperationEntry[]>(() => {
  const paths = content?.paths ?? {}
  const entries: OperationEntry[] = []

  for (const [path, pathItemRef] of Object.entries(paths)) {
    const resolvedPathItem = getResolvedPathItem(pathItemRef)

    forEachPathItemOperation(pathItemRef, (method, operation) => {
      const resolvedOperation = resolveOperation(operation)

      if (!resolvedOperation) {
        return
      }

      const parameters = getParameters(
        resolvedPathItem?.parameters,
        resolvedOperation.parameters,
      )
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

      entries.push({
        path,
        method,
        operation: resolvedOperation,
        parameters,
        requestBody,
        responses,
      })
    })
  }

  return entries
})

const webhooks = computed(() => {
  const webhookItems = content?.webhooks ?? {}
  const entries: {
    name: string
    method: string
    operation: OperationObject
  }[] = []

  for (const [name, pathItemRef] of Object.entries(webhookItems)) {
    forEachPathItemOperation(pathItemRef, (method, operation) => {
      const resolvedOperation = resolveOperation(operation)

      if (!resolvedOperation) {
        return
      }

      entries.push({ name, method, operation: resolvedOperation })
    })
  }

  return entries
})

const componentSchemas = computed(() => {
  const schemas = content?.components?.schemas ?? {}

  return Object.entries(schemas).flatMap(([name, schema]) => {
    const resolvedSchema = resolveSchema(schema)

    if (resolvedSchema === null) {
      return []
    }

    return [{ name, schema: resolvedSchema }]
  })
})

const getSchemaView = (schema: SchemaObject | boolean): SchemaView =>
  typeof schema === 'boolean'
    ? { type: schema ? 'any' : 'never' }
    : (schema as unknown as SchemaView)
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
            <li v-if="entry.operation.operationId">
              <strong>Operation ID:</strong>&nbsp;<code>{{
                entry.operation.operationId
              }}</code>
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

          <template v-if="entry.parameters.length">
            <section>
              <h4>Parameters</h4>

              <template
                v-for="parameter in entry.parameters"
                :key="`${parameter.in}:${parameter.name}`">
                <section>
                  <h5>
                    <code>{{ parameter.name }}</code>
                    <template v-if="parameter.required"> required</template>
                    <template v-if="parameter.deprecated"> deprecated</template>
                  </h5>
                  <ul>
                    <li>
                      <strong>In:</strong>&nbsp;<code>{{ parameter.in }}</code>
                    </li>
                    <template v-if="parameter.style">
                      <li>
                        <strong>Style:</strong>&nbsp;<code>{{
                          parameter.style
                        }}</code>
                      </li>
                    </template>
                    <template v-if="typeof parameter.explode === 'boolean'">
                      <li>
                        <strong>Explode:</strong>&nbsp;<code>{{
                          parameter.explode
                        }}</code>
                      </li>
                    </template>
                    <template v-if="parameter.allowEmptyValue">
                      <li><strong>Allow Empty Value:</strong>&nbsp;true</li>
                    </template>
                    <template v-if="parameter.allowReserved">
                      <li><strong>Allow Reserved:</strong>&nbsp;true</li>
                    </template>
                  </ul>

                  <ScalarMarkdown
                    v-if="parameter.description"
                    :value="parameter.description" />

                  <template v-if="resolveSchema(parameter.schema) !== null">
                    <Schema :schema="resolveSchema(parameter.schema)!" />
                  </template>

                  <Examples
                    v-if="parameter.example !== undefined || parameter.examples"
                    mode="write"
                    :source="parameter" />
                  <template v-if="parameter.content">
                    <template
                      v-for="(parameterContent, mediaType) in parameter.content"
                      :key="mediaType">
                      <h6>Content-Type: {{ mediaType }}</h6>
                      <template
                        v-if="resolveSchema(parameterContent.schema) !== null">
                        <Schema
                          :schema="resolveSchema(parameterContent.schema)!" />
                      </template>
                      <Examples
                        :mediaType="mediaType.toString()"
                        mode="write"
                        :source="parameterContent" />
                    </template>
                  </template>
                </section>
              </template>
            </section>
          </template>

          <template v-if="entry.requestBody">
            <section>
              <h4>Request Body</h4>
              <p v-if="typeof entry.requestBody.required === 'boolean'">
                <strong>Required:</strong>&nbsp;<code>{{
                  entry.requestBody.required
                }}</code>
              </p>
              <ScalarMarkdown
                v-if="entry.requestBody.description"
                :value="entry.requestBody.description" />
              <template
                v-for="(bodyContent, mediaType) in entry.requestBody.content"
                :key="mediaType">
                <h5>Content-Type: {{ mediaType }}</h5>
                <template v-if="resolveSchema(bodyContent.schema) !== null">
                  <Schema :schema="resolveSchema(bodyContent.schema)!" />
                </template>
                <Examples
                  :mediaType="mediaType.toString()"
                  mode="write"
                  :source="bodyContent" />
                <Encoding :encoding="bodyContent.encoding" />
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
                  <Headers :headers="entryResponse.response.headers" />
                  <ResponseLinks :links="entryResponse.response.links" />
                  <template v-if="entryResponse.response.content">
                    <template
                      v-for="(responseContent, mediaType) in entryResponse
                        .response.content"
                      :key="mediaType">
                      <section>
                        <h6>Content-Type: {{ mediaType }}</h6>
                        <template
                          v-if="resolveSchema(responseContent.schema) !== null">
                          <Schema
                            :schema="resolveSchema(responseContent.schema)!" />
                        </template>
                        <Examples
                          :mediaType="mediaType.toString()"
                          mode="read"
                          :source="responseContent" />
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
            hideDescription
            :schema="entry.schema" />
          <template v-if="getSchemaView(entry.schema).type === 'object'">
            <Examples :source="{ schema: entry.schema }" />
          </template>
        </section>
      </template>
    </section>
  </section>
</template>
