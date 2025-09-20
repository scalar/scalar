import type { ApiReferenceConfiguration } from '@scalar/types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { DiscriminatorObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isTypeObject } from './is-type-object'

/** Extract the type of properties */
type Properties = NonNullable<Extract<SchemaObject, { type: 'object' }>['properties']>

type Options = Partial<
  Pick<ApiReferenceConfiguration, 'orderSchemaPropertiesBy' | 'orderRequiredPropertiesFirst'> & {
    hideReadOnly: boolean
    hideWriteOnly: boolean
  }
>

/** Take a list of property names and reduce it back into an object */
export const reduceNamesToObject = (names: string[], properties: Properties): Properties =>
  names.reduce((acc, name) => {
    const prop = properties?.[name]
    if (prop) {
      acc[name] = prop
    }
    return acc
  }, {} as Properties)

/** Sort property names in an object schema */
export const sortPropertyNames = (
  schema: SchemaObject,
  discriminator?: DiscriminatorObject,
  {
    hideReadOnly = false,
    hideWriteOnly = false,
    orderSchemaPropertiesBy = 'alpha',
    orderRequiredPropertiesFirst = true,
  }: Options = {},
): string[] => {
  if (!isTypeObject(schema) || !schema.properties) {
    return []
  }

  const propertyNames = Object.keys(schema.properties)
  const requiredPropertiesSet = new Set(schema.required || [])

  return propertyNames
    .sort((a, b) => {
      const aDiscriminator = a === discriminator?.propertyName
      const bDiscriminator = b === discriminator?.propertyName

      const aRequired = requiredPropertiesSet.has(a)
      const bRequired = requiredPropertiesSet.has(b)

      // Discriminator comes first always
      if (aDiscriminator && !bDiscriminator) {
        return -1
      }
      if (!aDiscriminator && bDiscriminator) {
        return 1
      }

      // Order required properties first
      if (orderRequiredPropertiesFirst) {
        // If one is required and the other isn't, required comes first
        if (aRequired && !bRequired) {
          return -1
        }
        if (!aRequired && bRequired) {
          return 1
        }
      }

      // If both have the same required status, sort alphabetically
      if (orderSchemaPropertiesBy === 'alpha') {
        return a.localeCompare(b)
      }

      return 0
    })
    .filter((property) => {
      // If hideReadOnly is true, filter out properties that are readOnly
      if (hideReadOnly) {
        return !(schema.properties && getResolvedRef(schema.properties[property])?.readOnly === true)
      }
      // If hideWriteOnly is true, filter out properties that are writeOnly
      if (hideWriteOnly) {
        return !(schema.properties && getResolvedRef(schema.properties[property])?.writeOnly === true)
      }
      return true
    })
}
