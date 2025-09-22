import { isDefined } from '@scalar/oas-utils/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ComponentsObject,
  OpenApiDocument,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { authOptions } from '@/v2/blocks/scalar-auth-selector-block/helpers/auth-options'

/** Format a scheme object into a display object */
export const formatScheme = ({
  name,
  type,
  value,
}: {
  name: string
  type: SecuritySchemeObject['type'] | 'complex'
  value: NonNullable<OpenApiDocument['x-scalar-selected-security']>[number]
}) => ({
  id: name,
  label: type === 'openIdConnect' ? `${name} (coming soon)` : name,
  value,
})

/** Formats complex security schemes */
export const formatComplexScheme = (scheme: NonNullable<OpenApiDocument['security']>[number]) =>
  formatScheme(
    Object.keys(scheme).reduce(
      (acc, name, index) => {
        acc.name += `${index > 0 ? ' & ' : ''}${name}`
        return acc
      },
      { type: 'complex', name: '', value: scheme },
    ),
  )

export type SecuritySchemeOption = {
  id: string
  label: string
  value: NonNullable<OpenApiDocument['x-scalar-selected-security']>[number]
  isDeletable?: boolean
  payload?: SecuritySchemeObject
}

export type SecuritySchemeGroup = {
  label: string
  options: SecuritySchemeOption[]
}

/**
 * Generates the options for the security scheme combobox
 *
 * contains either a flat list, or different groups of required, available, and add new
 */
export const getSchemeOptions = (
  filteredRequirements: NonNullable<OpenApiDocument['security']>,
  securitySchemes: NonNullable<ComponentsObject['securitySchemes']>,
  isReadOnly: boolean = false,
): SecuritySchemeOption[] | SecuritySchemeGroup[] => {
  {
    /** Builds the required schemes formatted as options */
    const requiredFormatted = filteredRequirements
      .map((r): SecuritySchemeOption | undefined => {
        const keys = Object.keys(r)

        // Complex auth
        if (keys.length > 1) {
          return formatComplexScheme(r)
        }
        // Simple auth
        if (keys[0]) {
          const scheme = getResolvedRef(securitySchemes[keys[0]])

          if (!scheme) {
            return undefined
          }

          return formatScheme({ name: keys[0], type: scheme.type, value: r })
        }

        return undefined
      })
      .filter(isDefined)

    const availableFormatted = Object.keys(securitySchemes)
      .filter((name) => !requiredFormatted.some((r) => r.id === name))
      .map((name) => {
        const scheme = getResolvedRef(securitySchemes[name])
        if (scheme) {
          return formatScheme({ name, type: scheme.type, value: { [name]: [] } })
        }
        return undefined
      })
      .filter(isDefined)

    const options = [
      { label: 'Required authentication', options: requiredFormatted },
      { label: 'Available authentication', options: availableFormatted },
    ]

    if (isReadOnly) {
      return requiredFormatted.length ? options : availableFormatted
    }

    // Add new authentication options
    options.push({
      label: 'Add new authentication',
      options: Object.entries(authOptions).map(([key, value]) => ({
        id: key,
        label: value.label,
        value: { [key]: [] },
        payload: value.payload,
        // Disable deleting built-in options
        isDeletable: false,
      })),
    })

    return options
  }
}
