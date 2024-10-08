/**
 * Calculates the operation ID for OpenAPI paths.
 */
export function calculateOperationId(
  mode: string,
  name: string,
  summary: string,
): { operationId?: string } {
  if (mode === 'off') return {}

  if (mode === 'auto') {
    return { operationId: customCamelCase(summary) }
  }

  if (mode === 'brackets') {
    const matches = name.match(/\[([^[\]]*)]/)
    return matches ? { operationId: matches[1] } : {}
  }

  return {}
}

/**
 * Compiles the information object for OpenAPI from Postman collection JSON.
 */
export function compileInfo(
  postmanJson: any,
  optsInfo: Record<string, any>,
): Record<string, any> {
  const {
    info: { name, description: desc } = { name: '', description: '' },
    variable = [],
  } = postmanJson

  const version = getVarValue(variable, 'version', '1.0.0')
  const {
    title = name,
    description = desc,
    version: ver = version,
    termsOfService,
    license,
    contact,
    xLogo,
  } = optsInfo

  return {
    title,
    description,
    version: ver,
    ...parseXLogo(variable, xLogo),
    ...(termsOfService ? { termsOfService } : {}),
    ...parseContact(variable, contact),
    ...parseLicense(variable, license),
  }
}

/**
 * Parses external documentation information for OpenAPI.
 */
export function parseExternalDocs(
  variables: any[],
  optsExternalDocs: Record<string, any>,
): Record<string, any> {
  const description =
    optsExternalDocs.description ||
    getVarValue(variables, 'externalDocs.description')
  const url = optsExternalDocs.url || getVarValue(variables, 'externalDocs.url')

  return url
    ? { externalDocs: { url, ...(description ? { description } : {}) } }
    : {}
}

/**
 * Parses tags information for OpenAPI.
 */
export function parseTags(
  tagsObj: Record<string, string>,
): Record<string, any> {
  const tags = Object.entries(tagsObj).map(([name, description]) => ({
    name,
    description,
  }))
  return tags.length > 0 ? { tags } : {}
}

/**
 * Parses server information for OpenAPI.
 */
export function parseServers(
  domains: Set<string>,
  serversOpts?: Array<{ url: string; description?: string }>,
): Record<string, any> {
  const servers = serversOpts
    ? serversOpts.map(({ url, description }) => ({ url, description }))
    : Array.from(domains).map((domain) => ({ url: domain }))

  return servers.length > 0 ? { servers } : {}
}

function customCamelCase(input: string): string {
  return input
    .replace(/^[_.\s-]+/, '') // Remove leading spaces, underscores, dots, and dashes
    .toLowerCase()
    .replace(/(?:[_\s-.]+(.))/g, (_, character) => character.toUpperCase())
}

function getVarValue(
  variables: any[],
  name: string,
  def: any = undefined,
): any {
  const variable = variables.find(({ key }) => key === name)
  return variable ? variable.value : def
}

function parseXLogo(
  variables: any[],
  xLogo: Record<string, any> = {},
): Record<string, any> {
  const url = xLogo.url || getVarValue(variables, 'x-logo.urlVar')
  const backgroundColor =
    xLogo.backgroundColor || getVarValue(variables, 'x-logo.backgroundColorVar')
  const altText = xLogo.altText || getVarValue(variables, 'x-logo.altTextVar')
  const href = xLogo.href || getVarValue(variables, 'x-logo.hrefVar')

  return url ? { 'x-logo': { url, backgroundColor, altText, href } } : {}
}

function parseContact(
  variables: any[],
  optsContact: Record<string, any> = {},
): Record<string, any> {
  const name = optsContact.name || getVarValue(variables, 'contact.name')
  const url = optsContact.url || getVarValue(variables, 'contact.url')
  const email = optsContact.email || getVarValue(variables, 'contact.email')

  return [name, url, email].some((e) => e != null)
    ? {
        contact: {
          ...(name ? { name } : {}),
          ...(url ? { url } : {}),
          ...(email ? { email } : {}),
        },
      }
    : {}
}

function parseLicense(
  variables: any[],
  optsLicense: Record<string, any> = {},
): Record<string, any> {
  const name = optsLicense.name || getVarValue(variables, 'license.name')
  const url = optsLicense.url || getVarValue(variables, 'license.url')

  return name ? { license: { name, ...(url ? { url } : {}) } } : {}
}
