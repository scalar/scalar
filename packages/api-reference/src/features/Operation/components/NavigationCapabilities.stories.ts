import { createNavigation, createWorkspaceEventBus, withNavigation } from '@scalar/workspace-store/events'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { onBeforeUnmount, ref } from 'vue'

import SchemaPropertyHeading from '@/components/Content/Schema/SchemaPropertyHeading.vue'
import TestRequestButton from '@/features/test-request-button/TestRequestButton.vue'

import RequestBody from './RequestBody.vue'

const meta: Meta<{ hideModels: boolean }> = {
  title: 'Navigation/Capabilities',
  render: (args) => ({
    components: { RequestBody, SchemaPropertyHeading, TestRequestButton },
    setup: () => {
      const destination = ref('No destination yet')
      const events = createWorkspaceEventBus()
      const primary = createNavigation(events, {
        'scroll-to:model-by-name': ({ name }) => {
          destination.value = `Model: ${name}`
        },
        'ui:open:client-modal': () => {
          destination.value = 'Client: create-pet'
        },
      })
      onBeforeUnmount(primary.dispose)
      return {
        destination,
        eventBus: withNavigation(events, primary.navigation),
        document: coerceValue(OpenAPIDocumentSchema, {
          openapi: '3.1.0',
          info: { title: 'Pet API', version: '1.0.0' },
          components: { schemas: { Pet: { type: 'object', properties: { name: { type: 'string' } } } } },
        }),
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } },
        schema: coerceValue(SchemaObjectSchema, { type: 'object' }),
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
          hideModels: args.hideModels,
          expandAllSchemaProperties: false,
          schemaKeyboardNav: false,
        },
      }
    },
    template: `<main data-testid="navigation-capabilities" style="width: 520px; padding: 24px; background: var(--scalar-background-1); color: var(--scalar-color-1)">
      <h2>POST /pets</h2>
      <RequestBody :requestBody :document :options :eventBus><template #title>Body</template></RequestBody>
      <div data-testid="property-heading" style="margin: 24px 0"><SchemaPropertyHeading :value="schema" modelName="Pet" :modelLinkOptions="{ hideModels: options.hideModels }" :eventBus><template #name>pet</template></SchemaPropertyHeading></div>
      <TestRequestButton id="create-pet" method="post" path="/pets" :eventBus />
      <p role="status" style="margin-top: 16px">{{ destination }}</p>
    </main>`,
  }),
}
export default meta

type Story = StoryObj<typeof meta>
export const Supported: Story = { args: { hideModels: false } }
export const HiddenModels: Story = { args: { hideModels: true } }
