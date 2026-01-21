import { generateHash } from '@scalar/helpers/string/generate-hash'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ComponentsObject,
  OpenApiDocument,
  SecurityRequirementObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { authOptions } from '@/v2/blocks/scalar-auth-selector-block/helpers/auth-options'

/** A single security scheme option used in the auth dropdown */
export type SecuritySchemeOption = {
  id: string
  label: string
  value: SecurityRequirementObject
  isDeletable?: boolean
  payload?: SecuritySchemeObject
}

/** A group of security scheme options used in the auth dropdown */
export type SecuritySchemeGroup = {
  label: string
  options: SecuritySchemeOption[]
}

/**
 * Format a scheme object into a display object
 *
 * We also add a hash to the id to ensure it is unique across
 * multiple requirements of the same scheme with different scopes
 */
export const formatScheme = ({
  name,
  type,
  value,
}: {
  name: string
  type: SecuritySchemeObject['type'] | 'complex'
  value: SecurityRequirementObject
}) => ({
  id: generateHash(JSON.stringify(value)),
  label: type === 'openIdConnect' ? `${name} (coming soon)` : name,
  value,
  isDeletable: true,
})

/** Formats complex security schemes */
export const formatComplexScheme = (scheme: NonNullable<OpenApiDocument['security']>[number]) =>
  formatScheme({
    type: 'complex' as const,
    name: Object.keys(scheme).join(' & '),
    value: scheme,
  })

/**
 * Formats a security requirement into a SecuritySchemeOption.
 * Handles both simple (single key) and complex (multiple keys) auth schemes.
 */
const formatSecurityRequirement = (
  requirement: SecurityRequirementObject,
  securitySchemes: NonNullable<ComponentsObject['securitySchemes']>,
): SecuritySchemeOption | undefined => {
  const keys = Object.keys(requirement)

  // Complex auth (multiple keys)
  if (keys.length > 1) {
    return formatComplexScheme(requirement)
  }

  // Simple auth (single key)
  if (keys[0]) {
    const scheme = getResolvedRef(securitySchemes[keys[0]])
    if (!scheme) {
      return undefined
    }
    return formatScheme({ name: keys[0], type: scheme.type, value: requirement })
  }

  return undefined
}

/**
 * Generates the options for the security scheme combobox
 *
 * Contains either a flat list, or different groups of required, available, and add new
 */
export const getSecuritySchemeOptions = (
  security: NonNullable<OpenApiDocument['security']>,
  securitySchemes: NonNullable<ComponentsObject['securitySchemes']>,
  /** We need to add the selected schemes if they do not already exist in the calculated options */
  selectedSchemes: SecurityRequirementObject[],
): SecuritySchemeOption[] | SecuritySchemeGroup[] => {
  /**
   * Build required schemes formatted as options and track scheme names in a single pass.
   * We use names (not full IDs) because we want to exclude any scheme that is already
   * required, regardless of its specific scopes or hash.
   */
  const { requiredFormatted, requiredSchemeNames, existingIds } = security.reduce(
    (acc, requirement) => {
      const formatted = formatSecurityRequirement(requirement, securitySchemes)
      if (formatted) {
        acc.requiredFormatted.push(formatted)
        acc.existingIds.add(formatted.id)
      }
      for (const name of Object.keys(requirement)) {
        acc.requiredSchemeNames.add(name)
      }
      return acc
    },
    {
      requiredFormatted: [] as SecuritySchemeOption[],
      requiredSchemeNames: new Set<string>(),
      existingIds: new Set<string>(),
    },
  )

  // Build available schemes (excluding schemes that are in the required list)
  const availableFormatted: SecuritySchemeOption[] = []
  for (const [name, schemeRef] of Object.entries(securitySchemes)) {
    if (requiredSchemeNames.has(name)) {
      continue
    }

    const scheme = getResolvedRef(schemeRef)
    if (scheme) {
      const formatted = formatScheme({ name, type: scheme.type, value: { [name]: [] } })
      availableFormatted.push(formatted)
      existingIds.add(formatted.id)
    }
  }

  /**
   * Add selected schemes to available if they do not already exist
   * This ensures that selected schemes with specific scopes are always available as options
   */
  for (const selectedScheme of selectedSchemes) {
    const formatted = formatSecurityRequirement(selectedScheme, securitySchemes)
    if (formatted && !existingIds.has(formatted.id)) {
      availableFormatted.push(formatted)
      existingIds.add(formatted.id)
    }
  }

  const options = [
    { label: 'Required authentication', options: requiredFormatted },
    { label: 'Available authentication', options: availableFormatted },
  ]

  // Add new authentication options
  options.push({
    label: 'Add new authentication',
    options: Object.entries(authOptions).map(([key, value]) => ({
      id: key,
      label: value.label,
      value: { [key]: [] },
      payload: value.payload,
      isDeletable: false,
    })),
  })

  return options
}
