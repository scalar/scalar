import { generateHash } from '@scalar/helpers/string/generate-hash'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OAuthFlowsObjectSecret } from '@scalar/workspace-store/request-example'
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

const requirementSignature = (requirement: SecurityRequirementObject): string =>
  JSON.stringify(Object.keys(requirement))

/**
 * Format a scheme object into a display object
 *
 * We also add a hash to the id to ensure it is unique across
 * multiple requirements of the same scheme with different scopes
 */
export const formatScheme = ({ name, value }: { name: string; value: SecurityRequirementObject }) => ({
  id: generateHash(JSON.stringify(value)),
  label: name,
  value,
  isDeletable: true,
})

/** Formats complex security schemes */
export const formatComplexScheme = (scheme: NonNullable<OpenApiDocument['security']>[number]) =>
  formatScheme({
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
    return formatScheme({ name: keys[0], value: requirement })
  }

  return undefined
}

/**
 * An oauth2 scheme that isn't an operation's declared requirement is a token-acquisition
 * source — how a credential is obtained, not a competing auth method. It's reached via the
 * bearer scheme's "Authorize via OAuth2" action, so it's kept out of the auth dropdown to
 * avoid presenting it as a selectable peer (which collides with bearer on `Authorization`).
 */
const isAcquisitionScheme = (scheme: SecuritySchemeObject | undefined): boolean =>
  scheme !== undefined && scheme.type === 'oauth2'

/**
 * Finds the first oauth2 scheme with an interactive grant (authorization code / implicit)
 * — the kind that sends a user to an IdP login — to power the bearer scheme's
 * "Authorize via OAuth2" shortcut.
 */
export const getOauth2AcquisitionTarget = (
  securitySchemes: NonNullable<ComponentsObject['securitySchemes']>,
): {
  name: string
  flows: OAuthFlowsObjectSecret
  flowType: 'authorizationCode' | 'implicit'
  scopes: string[]
} | null => {
  for (const [name, schemeRef] of Object.entries(securitySchemes)) {
    const scheme = getResolvedRef(schemeRef)
    if (scheme?.type !== 'oauth2') {
      continue
    }
    const flows = scheme.flows as OAuthFlowsObjectSecret | undefined
    if (!flows) {
      continue
    }
    const flowType: 'authorizationCode' | 'implicit' | undefined = flows.authorizationCode
      ? 'authorizationCode'
      : flows.implicit
        ? 'implicit'
        : undefined
    if (flowType) {
      return {
        name,
        flows,
        flowType,
        scopes: (scheme as { 'x-default-scopes'?: string[] })['x-default-scopes'] ?? [],
      }
    }
  }
  return null
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
  /** Allows adding authentication which is not in the document */
  canAddNewAuth = false,
): SecuritySchemeOption[] | SecuritySchemeGroup[] => {
  const selectedByRequirement = new Map(
    selectedSchemes.map((selectedScheme) => [requirementSignature(selectedScheme), selectedScheme]),
  )

  /**
   * Build required schemes formatted as options and track scheme names in a single pass.
   * We use names (not full IDs) because we want to exclude any scheme that is already
   * required, regardless of its specific scopes or hash.
   */
  const { requiredFormatted, requiredSchemeNames, existingIds } = security.reduce(
    (acc, requirement) => {
      // If a required requirement is selected with scopes, use that selected value to
      // keep a single option entry and avoid a phantom duplicate.
      const requirementValue = selectedByRequirement.get(requirementSignature(requirement)) ?? requirement
      const formatted = formatSecurityRequirement(requirementValue, securitySchemes)
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

  // Build the available schemes, excluding schemes that are required or that are oauth2
  // acquisition sources (those are reached via the bearer scheme's Authorize shortcut).
  const availableFormatted: SecuritySchemeOption[] = []
  for (const [name, schemeRef] of Object.entries(securitySchemes)) {
    if (requiredSchemeNames.has(name)) {
      continue
    }

    const scheme = getResolvedRef(schemeRef)
    if (scheme && !isAcquisitionScheme(scheme)) {
      const formatted = formatScheme({ name, value: { [name]: [] } })
      existingIds.add(formatted.id)
      availableFormatted.push(formatted)
    }
  }

  /**
   * Add selected schemes if they do not already exist
   * This ensures that selected schemes with specific scopes are always available as options
   */
  for (const selectedScheme of selectedSchemes) {
    const formatted = formatSecurityRequirement(selectedScheme, securitySchemes)
    if (formatted && !existingIds.has(formatted.id)) {
      const key = Object.keys(selectedScheme)[0]
      const scheme = key ? getResolvedRef(securitySchemes[key]) : undefined
      if (!isAcquisitionScheme(scheme)) {
        existingIds.add(formatted.id)
        availableFormatted.push(formatted)
      }
    }
  }

  const options = [
    { label: 'Required authentication', options: requiredFormatted },
    { label: 'Available authentication', options: availableFormatted },
  ]

  // We don't return the groups if we don't have any required schemes
  if (!canAddNewAuth) {
    return requiredFormatted.length ? options : availableFormatted
  }

  // Add new authentication options (unless explicitly hidden)
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
