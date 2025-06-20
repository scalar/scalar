import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed, provide, ref } from 'vue'

import type { Schemas } from '@/features/Operation/types/schemas'
import { DISCRIMINATOR_CONTEXT, EXAMPLE_CONTEXT, useDiscriminator } from '@/hooks/useDiscriminator'

/** Check if a schema has discriminator usage */
function hasDiscriminatorInSchema(schema: OpenAPIV3_1.SchemaObject | undefined): boolean {
  if (!schema) {
    return false
  }

  // Check if schema itself has discriminator
  if (schema.discriminator) {
    return true
  }

  // Check if array items have discriminator
  if (schema.type === 'array' && schema.items && typeof schema.items === 'object' && 'discriminator' in schema.items) {
    return true
  }

  return false
}

/** Handling discriminator logic in operations */
export function useOperationDiscriminator(operation?: OpenAPIV3_1.OperationObject, schemas?: Schemas) {
  const requestBodySchema = operation?.requestBody?.content?.['application/json']?.schema

  /** Check if discriminator handling is needed */
  const hasSchemaDiscriminator = computed(() => hasDiscriminatorInSchema(requestBodySchema))

  /** Setup discriminator handling */
  const discriminator = hasSchemaDiscriminator.value
    ? useDiscriminator({
        schema: requestBodySchema,
        schemas: schemas,
        onSchemaChange: (newSchema) => {
          if (operation?.requestBody?.content?.['application/json']) {
            operation.requestBody.content['application/json'].schema = newSchema
          }
        },
      })
    : {
        selectedType: ref(''),
        discriminatorMapping: computed(() => ({})),
        discriminatorPropertyName: computed(() => ''),
        hasDiscriminator: computed(() => false),
        mergedSchema: computed(() => requestBodySchema),
        generateExampleValue: () => ({}),
      }

  // Extract values
  const {
    selectedType,
    discriminatorMapping,
    discriminatorPropertyName,
    hasDiscriminator,
    mergedSchema,
    generateExampleValue,
  } = discriminator

  if (hasSchemaDiscriminator.value) {
    const discriminatorContext = computed(() => ({
      selectedType: selectedType.value || undefined,
      discriminatorMapping: discriminatorMapping.value || {},
      discriminatorPropertyName: discriminatorPropertyName.value || '',
      hasDiscriminator: hasDiscriminator.value,
      mergedSchema: mergedSchema.value,
    }))

    provide(DISCRIMINATOR_CONTEXT, discriminatorContext)

    // Provide the example context separately since it's only used in ExampleRequest
    provide(EXAMPLE_CONTEXT, {
      generateExampleValue,
    })
  } else {
    provide(
      DISCRIMINATOR_CONTEXT,
      computed(() => null),
    )
    provide(EXAMPLE_CONTEXT, {
      generateExampleValue: () => ({}),
    })
  }

  const handleDiscriminatorChange = (type: string) => {
    if (!hasSchemaDiscriminator.value) {
      return
    }

    // Update the selected type which will trigger useDiscriminator's schema update
    selectedType.value = type
  }

  return {
    hasSchemaDiscriminator,
    handleDiscriminatorChange,
  }
}
