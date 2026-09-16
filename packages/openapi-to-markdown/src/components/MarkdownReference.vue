<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import {
  forEachPathItemOperation,
  getResolvedPathItem,
} from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import {
  getResolvedRef,
  mergeSiblingReferences,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type {
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  PathItemObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

// import { snippetz, type HarRequest } from '@scalar/snippetz'

import Schema from './Schema.vue'
import Security from './Security.vue'
import XmlOrJson from './XmlOrJson.vue'

type MarkdownDocument = Partial<OpenApiDocument> &
  Pick<OpenApiDocument, 'openapi' | 'info'>
type SchemaView = {
  description?: string
  title?: string
  type?: string | string[]
}
type RequestBodyView = {
  description?: string
  required?: boolean
  content?: Record<string, { schema?: unknown }>
}
type ParameterView = {
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
  servers: OpenApiDocument['servers']
  security: OpenApiDocument['security']
  parameters: ParameterView[]
  requestBody: RequestBodyView | null
  responses: Array<{
    statusCode: string
    response: ResponseView
  }>
}

const {
  content,
  part = false,
  introduction = true,
} = defineProps<{
  content: MarkdownDocument
  part?: boolean
  introduction?: boolean
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
  const resolved = getResolvedRef(reference as never, (node) => {
    const resolved = mergeSiblingReferences(node)
    // The merged value is already resolved; do not leave a dangling reference for child renderers.
    if (resolved && typeof resolved === 'object') {
      Reflect.deleteProperty(resolved, '$ref')
    }
    return resolved
  })

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

const getEntries = (
  paths: Record<string, PathItemObject>,
): OperationEntry[] => {
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
        servers:
          resolvedOperation.servers ??
          resolvedPathItem?.servers ??
          content.servers,
        security: resolvedOperation.security ?? content.security,
        parameters,
        requestBody,
        responses,
      })
    })
  }

  return entries
}

const groups = computed(() => [
  {
    title: 'Operations',
    webhook: false,
    entries: getEntries(content.paths ?? {}),
  },
  {
    title: 'Webhooks',
    webhook: true,
    entries: getEntries(content.webhooks ?? {}),
  },
])

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
    <template v-if="introduction">
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
          <li v-if="content.info.termsOfService">
            <strong>Terms of service:</strong>
            <a :href="content.info.termsOfService">{{
              content.info.termsOfService
            }}</a>
          </li>
          <li v-if="content.info.contact">
            <strong>Contact:</strong> {{ content.info.contact.name }}
            <a
              v-if="content.info.contact.url"
              :href="content.info.contact.url"
              >{{ content.info.contact.url }}</a
            >
            <a
              v-if="content.info.contact.email"
              :href="`mailto:${content.info.contact.email}`"
              >{{ content.info.contact.email }}</a
            >
          </li>
          <li v-if="content.info.license">
            <strong>License:</strong>
            <a
              v-if="content.info.license.url"
              :href="content.info.license.url"
              >{{ content.info.license.name }}</a
            ><template v-else>{{ content.info.license.name }}</template>
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
                  v-if="
                    server.variables && Object.keys(server.variables).length
                  ">
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

      <Security
        :requirements="content.security"
        :schemes="content.components?.securitySchemes" />
    </template>
    <section v-if="content.tags?.length">
      <h2 v-if="!part">Tags</h2>
      <section
        v-for="tag in content.tags"
        :key="tag.name">
        <h3>{{ tag.name }}</h3>
        <ScalarMarkdown :value="tag.description" />
        <a
          v-if="tag.externalDocs"
          :href="tag.externalDocs.url"
          >{{ tag.externalDocs.description ?? tag.externalDocs.url }}</a
        >
      </section>
    </section>
    <template
      v-for="group in groups"
      :key="group.title">
      <section v-if="group.entries.length">
        <h2 v-if="!part">{{ group.title }}</h2>

        <template
          v-for="entry in group.entries"
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
                <strong>{{ group.webhook ? 'Webhook:' : 'Path:' }}</strong
                >&nbsp;<code>{{ entry.path }}</code>
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
            <section v-if="entry.servers?.length">
              <h4>Effective servers</h4>
              <ul>
                <li
                  v-for="server in entry.servers"
                  :key="server.url">
                  <code>{{ server.url }}</code
                  ><ScalarMarkdown :value="server.description" />
                  <ul v-if="server.variables">
                    <li
                      v-for="(variable, name) in server.variables"
                      :key="name">
                      {{ name }}: <code>{{ variable.default }}</code>
                    </li>
                  </ul>
                </li>
              </ul>
            </section>
            <Security
              :requirements="entry.security"
              :schemes="content.components?.securitySchemes" />

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
                      <template v-if="parameter.deprecated">
                        deprecated
                      </template>
                    </h5>
                    <ul>
                      <li>
                        <strong>In:</strong>&nbsp;<code>{{
                          parameter.in
                        }}</code>
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

                    <template v-if="resolveSchema(parameter.schema)">
                      <Schema :schema="resolveSchema(parameter.schema)!" />
                    </template>

                    <template v-if="parameter.content">
                      <template
                        v-for="(
                          parameterContent, mediaType
                        ) in parameter.content"
                        :key="mediaType">
                        <h6>Content-Type: {{ mediaType }}</h6>
                        <template v-if="resolveSchema(parameterContent.schema)">
                          <Schema
                            :schema="resolveSchema(parameterContent.schema)!" />
                        </template>
                      </template>
                    </template>
                  </section>
                </template>
              </section>
            </template>

            <template v-if="entry.requestBody?.content">
              <section>
                <h4>Request Body</h4>
                <ScalarMarkdown :value="entry.requestBody.description" />
                <p v-if="entry.requestBody.required">
                  <strong>Required:</strong> true
                </p>
                <template
                  v-for="(bodyContent, mediaType) in entry.requestBody.content"
                  :key="mediaType">
                  <h5>Content-Type: {{ mediaType }}</h5>
                  <template v-if="resolveSchema(bodyContent.schema)">
                    <Schema :schema="resolveSchema(bodyContent.schema)!" />
                    <p><strong>Example:</strong></p>
                    <XmlOrJson
                      :modelValue="
                        getExampleFromSchema(
                          resolveSchema(bodyContent.schema)!,
                          {
                            xml: mediaType?.toString().includes('xml'),
                          },
                        )
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
                          <template
                            v-if="resolveSchema(responseContent.schema)">
                            <Schema
                              :schema="
                                resolveSchema(responseContent.schema)!
                              " />
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
    </template>

    <section v-if="componentSchemas.length">
      <h2 v-if="!part">Schemas</h2>
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
          <Schema :schema="entry.schema" />
          <template v-if="getSchemaView(entry.schema).type === 'object'">
            <p><strong>Example:</strong></p>
            <XmlOrJson :modelValue="getExampleFromSchema(entry.schema)" />
          </template>
        </section>
      </template>
    </section>
  </section>
</template>
