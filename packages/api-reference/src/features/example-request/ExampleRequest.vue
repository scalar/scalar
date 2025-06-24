<script setup lang="ts">
import { useWorkspace } from '@scalar/api-client/store'
import {
  getHarRequest,
  getSnippet,
} from '@scalar/api-client/views/Components/CodeSnippet'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import { ScalarCodeBlock } from '@scalar/components'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import {
  createExampleFromRequest,
  requestSchema,
  type Collection,
  type Request,
  type Server,
} from '@scalar/oas-utils/entities/spec'
import { isDereferenced } from '@scalar/openapi-types/helpers'
import type { ClientId, TargetId } from '@scalar/snippetz'
import type { OpenAPIV3_1 } from '@scalar/types/legacy'
import {
  computed,
  inject,
  onMounted,
  ref,
  useId,
  watch,
  type ComponentPublicInstance,
} from 'vue'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/Card'
import { HttpMethod } from '@/components/HttpMethod'
import ScreenReader from '@/components/ScreenReader.vue'
import type { Schemas } from '@/features/Operation/types/schemas'
import { useConfig } from '@/hooks/useConfig'
import {
  DISCRIMINATOR_CONTEXT,
  EXAMPLE_CONTEXT,
} from '@/hooks/useDiscriminator'
import { useExampleStore } from '@/legacy/stores'
import {
  useHttpClientStore,
  type HttpClientState,
} from '@/stores/useHttpClientStore'

import ExamplePicker from './ExamplePicker.vue'
import TextSelect from './TextSelect.vue'

const { operation, request, collection, server, method } = defineProps<{
  server: Server | undefined
  collection: Collection
  operation: OpenAPIV3_1.OperationObject
  request: Request | undefined
  method: OpenAPIV3_1.HttpMethods
  /** Show a simplified card if no example are available */
  fallback?: boolean
  schemas?: Schemas
}>()

const { selectedExampleKey, operationId } = useExampleStore()
const { requestExamples, securitySchemes, requestExampleMutators } =
  useWorkspace()
const config = useConfig()

const {
  httpClient,
  setHttpClient,
  availableTargets,
  httpTargetTitle,
  httpClientTitle,
} = useHttpClientStore()

const id = useId()
/** Track example update to avoid maximum recursion */
const isUpdating = ref(false)

// Inject both contexts directly
const exampleContext = inject(EXAMPLE_CONTEXT)

const discriminatorContext = inject(DISCRIMINATOR_CONTEXT)

const discriminator = computed(() => discriminatorContext?.value?.selectedType)

const hasDiscriminator = computed(
  () => discriminatorContext?.value?.hasDiscriminator || false,
)

const customRequestExamples = computed(() => {
  const keys = ['x-custom-examples', 'x-codeSamples', 'x-code-samples'] as const

  for (const key of keys) {
    if (operation?.[key]) {
      const examples = [...operation[key]]
      return examples
    }
  }

  return []
})

/** Use the selected custom example or the globally selected HTTP client */
const localHttpClient = ref<
  | HttpClientState
  | {
      targetKey: 'customExamples'
      clientKey: number
    }
>(
  // Default to first custom example
  customRequestExamples.value.length
    ? {
        targetKey: 'customExamples',
        clientKey: 0,
      }
    : // Otherwise use the globally selected HTTP client
      {
        targetKey: httpClient.targetKey,
        clientKey: httpClient.clientKey,
      },
)

// Overwrite the locally selected HTTP client when the global one changes
watch(httpClient, () => {
  localHttpClient.value = {
    targetKey: httpClient.targetKey,
    clientKey: httpClient.clientKey,
  }
})

const hasMultipleExamples = computed(() => {
  const examples = getExamplesFromOperation.value
  return Object.keys(examples).length > 1
})

const generateSnippet = () => {
  // Use the selected custom example
  if (localHttpClient.value.targetKey === 'customExamples') {
    return (
      customRequestExamples.value[localHttpClient.value.clientKey]?.source ?? ''
    )
  }

  const clientKey = httpClient.clientKey as ClientId<TargetId>
  const targetKey = httpClient.targetKey

  // Create a hacky request if we are a webhook
  const _request =
    request ||
    requestSchema.parse({
      uid: operation.operationId || 'temp-request',
      method: method,
      path: operation.path,
      parameters: operation.parameters || [],
      requestBody: operation.requestBody,
      examples: [],
      type: 'request',
      selectedSecuritySchemeUids: [],
      selectedServerUid: '',
      servers: [],
      summary: operation.summary || 'Example Request',
    })

  // TODO: Currently we just grab the first one but we should sync up the store with the example picker
  let example = requestExamples[request?.examples?.[0] ?? '']

  // This is for webhooks, super hacky code then we should redo this whole component with the new store
  if (!example) {
    const examples = getExamplesFromOperation.value
    const firstExampleKey = Object.keys(examples)[0]

    // Create the example from the request
    example = createExampleFromRequest(_request, firstExampleKey)
  }

  // Ensure the selected security is in the security requirements
  const schemes = filterSecurityRequirements(
    operation.security || collection.security,
    collection.selectedSecuritySchemeUids,
    securitySchemes,
  )

  const harRequest = getHarRequest({
    operation: _request,
    example,
    server,
    securitySchemes: schemes,
  })

  const [error, payload] = getSnippet(targetKey, clientKey, harRequest)
  if (error) {
    return error.message ?? ''
  }
  return payload
}

const generatedCode = computed<string>(() => {
  try {
    return generateSnippet()
  } catch (error) {
    console.error('[generateSnippet]', error)
    return ''
  }
})

/** Get all examples from the operation for any content type */
const getExamplesFromOperation = computed(() => {
  if (!isDereferenced(operation.requestBody)) {
    return {}
  }
  const content = operation.requestBody?.content ?? {}

  // Return first content type examples by default
  const firstContentType = Object.values(content)[0]
  return firstContentType?.examples ?? {}
})

/** Code language of the snippet */
const language = computed(() => {
  const key =
    // Specified language
    localHttpClient.value?.targetKey === 'customExamples'
      ? (customRequestExamples.value[localHttpClient.value.clientKey]?.lang ??
        'plaintext')
      : // Or language for the globally selected HTTP client
        httpClient.targetKey

  // Normalize language
  if (key === 'shell' && generatedCode.value.includes('curl')) {
    return 'curl'
  }
  if (key === 'Objective-C') {
    return 'objc'
  }

  return key
})

/**  Block secrets from being shown in the code block */
const secretCredentials = computed(() =>
  Object.values(securitySchemes).flatMap((scheme) => {
    if (scheme.type === 'apiKey') {
      return scheme.value
    }
    if (scheme?.type === 'http') {
      return [
        scheme.token,
        scheme.password,
        btoa(`${scheme.username}:${scheme.password}`),
      ]
    }
    if (scheme.type === 'oauth2') {
      return Object.values(scheme.flows).map((flow) => flow.token)
    }

    return []
  }),
)

type TextSelectOptions = InstanceType<typeof TextSelect>['$props']['options']

/** All options for the dropdown */
const options = computed<TextSelectOptions>(() => {
  // Add available the client libraries
  const entries: TextSelectOptions = availableTargets.value.map((target) => {
    return {
      value: target.key,
      label: target.title,
      options: target.clients.map((c) => {
        return {
          value: JSON.stringify({
            targetKey: target.key,
            clientKey: c.client,
          }),
          label: c.title,
        }
      }),
    }
  })

  // Add entries for custom examples if any are available
  if (customRequestExamples.value.length) {
    entries.unshift({
      value: 'customExamples',
      label: 'Examples',
      options: customRequestExamples.value.map((example, index) => ({
        value: JSON.stringify({
          targetKey: 'customExamples',
          clientKey: index,
        }),
        label: example.label ?? example.lang ?? `Example #${index + 1}`,
      })),
    })
  }

  return entries
})

const elem = ref<ComponentPublicInstance | null>(null)

/** Set custom example, or update the selected HTTP client globally */
function updateHttpClient(value: string) {
  const data = JSON.parse(value)

  // We need to freeze the ui to prevent scrolling as the clients change
  if (elem.value) {
    const unfreeze = freezeElement(elem.value.$el)
    setTimeout(() => {
      unfreeze()
    }, 300)
  }

  // Update to the local example
  if (data.targetKey === 'customExamples') {
    localHttpClient.value = data
  }
  // Here we need to handle a special case when we have custom selected and the global doesn't change
  else if (
    localHttpClient.value.targetKey === 'customExamples' &&
    data.targetKey === httpClient.targetKey &&
    data.clientKey === httpClient.clientKey
  ) {
    localHttpClient.value = data
  }
  // Update the global example
  else {
    setHttpClient(data)
  }
}

/** Update the selected example and the operation ID */
function handleExampleUpdate(value: string) {
  selectedExampleKey.value = value
  operationId.value = operation.operationId

  const example = requestExamples[request?.examples?.[0] ?? '']
  const selectedExample = getExamplesFromOperation.value[value]

  // Update the example body
  if (example && selectedExample?.value) {
    try {
      requestExampleMutators.edit(
        example.uid,
        'body.raw.value',
        JSON.stringify(selectedExample.value, null, 2),
      )
    } catch (error) {
      console.error('[handleExampleUpdate]', error)
    }
  }
}

// Display initial discriminator type selection
onMounted(() => {
  if (hasDiscriminator.value && discriminator.value && !isUpdating.value) {
    handleDiscriminatorChange(discriminator.value)
  }
})

const handleDiscriminatorChange = (type: string) => {
  if (isUpdating.value) {
    return
  }

  try {
    isUpdating.value = true

    // Update the example with the selected type and merged properties
    const example = requestExamples[operation.examples[0]]
    if (example && exampleContext?.generateExampleValue) {
      // Generate the new example value
      const currentValue = example.body?.raw?.value
        ? JSON.parse(example.body.raw.value)
        : undefined
      const updatedValue = exampleContext.generateExampleValue(
        Array.isArray(currentValue),
      )

      // Update the example body
      requestExampleMutators.edit(
        example.uid,
        'body.raw.value',
        JSON.stringify(updatedValue, null, 2),
      )

      // Update the operation's example value directly
      if (request?.examples?.[0]) {
        const exampleRef = requestExamples[request?.examples?.[0]]
        if (exampleRef) {
          requestExampleMutators.edit(
            exampleRef.uid,
            'body.raw.value',
            JSON.stringify(updatedValue, null, 2),
          )
        }
      }

      // Also update the transformed operation's examples
      if (operation.requestBody?.content?.['application/json']?.examples) {
        const examples =
          operation.requestBody.content['application/json'].examples
        Object.keys(examples).forEach((key) => {
          if (examples[key]?.value) {
            examples[key].value = updatedValue
          }
        })
      }
    }
  } catch (error) {
    console.error('[handleDiscriminatorChange]', error)
  } finally {
    isUpdating.value = false
  }
}

// Watch for changes to discriminator type
watch(discriminator, (newValue) => {
  if (newValue && hasDiscriminator.value && !isUpdating.value) {
    handleDiscriminatorChange(newValue)
  }
})
</script>
<template>
  <Card
    v-if="availableTargets.length || customRequestExamples.length"
    :aria-labelledby="`${id}-header`"
    class="dark-mode"
    ref="elem"
    role="region">
    <CardHeader muted>
      <div
        :id="`${id}-header`"
        class="request-header">
        <ScreenReader>Request Example for</ScreenReader>
        <HttpMethod
          as="span"
          class="request-method"
          :method="method" />
        <slot name="header" />
      </div>
      <template #actions>
        <TextSelect
          class="request-client-picker"
          :controls="`${id}-example`"
          :modelValue="JSON.stringify(localHttpClient)"
          :options="options"
          @update:modelValue="updateHttpClient">
          <template v-if="localHttpClient.targetKey === 'customExamples'">
            <ScreenReader>Selected Example:</ScreenReader>
            {{
              customRequestExamples[localHttpClient.clientKey].label ??
              'Example'
            }}
          </template>
          <template v-else>
            <ScreenReader>Selected HTTP client:</ScreenReader>
            {{ httpTargetTitle }}
            {{ httpClientTitle }}
          </template>
        </TextSelect>
      </template>
    </CardHeader>
    <CardContent
      borderless
      class="request-editor-section custom-scroll"
      frameless>
      <!-- Multiple examples -->
      <div
        :id="`${id}-example`"
        class="code-snippet">
        <ScalarCodeBlock
          class="bg-b-2 -outline-offset-2"
          :content="generatedCode"
          :hideCredentials="secretCredentials"
          :lang="language"
          lineNumbers />
      </div>
    </CardContent>
    <CardFooter
      v-if="
        (hasMultipleExamples || !config.hideTestRequestButton) && $slots.footer
      "
      class="request-card-footer"
      contrast>
      <div
        v-if="hasMultipleExamples"
        class="request-card-footer-addon">
        <ExamplePicker
          class="request-example-selector"
          :examples="getExamplesFromOperation"
          :modelValue="selectedExampleKey"
          @update:modelValue="handleExampleUpdate" />
      </div>
      <slot name="footer" />
    </CardFooter>
  </Card>
  <Card
    v-else-if="fallback"
    class="dark-mode">
    <CardContent class="request-card-simple">
      <div class="request-header">
        <HttpMethod
          as="span"
          class="request-method"
          :method="method" />
        <slot name="header" />
      </div>
      <slot name="footer" />
    </CardContent>
  </Card>
</template>
<style scoped>
.request {
  display: flex;
  flex-wrap: nowrap;
}
.request-header {
  display: flex;
  gap: 6px;
  text-transform: initial;
}
.request-method {
  font-family: var(--scalar-font-code);
  text-transform: uppercase;
}
.request-client-picker {
  padding-left: 12px;
  padding-right: 9px;
}
.request-card-footer {
  display: flex;
  justify-content: flex-end;
  padding: 6px;
  flex-shrink: 0;
}
.request-card-footer-addon {
  display: flex;
  align-items: center;

  flex: 1;
  min-width: 0;
}
.request-editor-section {
  display: flex;
  flex: 1;
}
.request-card-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 8px 8px 8px 12px;

  font-size: var(--scalar-small);
}
.code-snippet {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
