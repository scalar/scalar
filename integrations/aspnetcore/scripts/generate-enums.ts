import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Generator script to create C# enums from TypeScript clients configuration.
 * This script directly imports the clients array from the TypeScript source,
 * ensuring the C# enums stays in perfect sync with the TypeScript source of truth.
 */

/**
 * Custom PascalCase mappings for better C# naming conventions.
 * Only add entries here when the default conversion doesn't produce professional C# names.
 */
const CUSTOM_PASCAL_CASE_MAPPINGS: Record<string, string> = {
  // Clients - Better naming for professional C# code
  'httpclient': 'HttpClient',
  'restsharp': 'RestSharp',
  'clj_http': 'CljHttp',
  'asynchttp': 'AsyncHttp',
  'nethttp': 'NetHttp',
  'okhttp': 'OkHttp',
  'ofetch': 'OFetch',
  'jquery': 'JQuery',
  'nsurlsession': 'NSUrlSession',
  'cohttp': 'CoHttp',
  'webrequest': 'WebRequest',
  'restmethod': 'RestMethod',
  'python3': 'Python3',
  'httpx_sync': 'HttpxSync',
  'httpx_async': 'HttpxAsync',
  'reqwest': 'Reqwest',

  // Targets - Professional naming for languages/platforms
  'js': 'JavaScript',
  'csharp': 'CSharp',
  'objc': 'ObjC',
  'ocaml': 'OCaml',
  'powershell': 'PowerShell',

  // Special cases - Non-standard naming requirements
  'http1.1': 'Http11',
}

/**
 * Obsolete client entries for backward compatibility.
 * Add entries here when client names change to maintain backward compatibility.
 */
const OBSOLETE_CLIENT_ENTRIES = [
  {
    name: 'Nsurlsession',
    description: 'nsurlsession',
    reason: 'Use NSUrlSession instead.',
  },
  {
    name: 'Http1',
    description: 'http1',
    reason: 'This client is no longer supported.',
  },
  {
    name: 'Http2',
    description: 'http2',
    reason: 'This client is no longer supported.',
  },
]

/**
 * Regex patterns used for parsing TypeScript files
 */
const PATTERNS = {
  // Matches: export const pluginName: Plugin = { target: 'js', client: 'fetch', title: 'Fetch' }
  PLUGIN_EXPORT:
    /export\s+const\s+(\w+):\s*Plugin\s*=\s*{[^}]*target:\s*'([^']+)'[^}]*client:\s*'([^']+)'[^}]*title:\s*'([^']+)'/s,

  // Matches: { key: 'js', title: 'JavaScript', default: 'fetch', clients: [jsFetch, jsAxios] }
  TARGET_DEFINITION: /{\s*key:\s*'([^']+)',\s*title:\s*'([^']+)',\s*default:\s*'([^']+)',\s*clients:\s*\[([^\]]+)\]/g,

  // Matches: import names like jsFetch, nodeAxios, etc.
  CLIENT_IMPORT_NAMES: /[a-zA-Z][a-zA-Z0-9]*/g,
}

// We'll use dynamic import to load the clients array directly
type ImportedTarget = {
  key: string
  title: string
  default: string
  clients: Array<{
    target: string
    client: string
    title: string
  }>
}

/**
 * Helper function to convert a string to PascalCase for C# enum values.
 * Uses the custom mappings defined at the top of the file for better naming conventions.
 */
function toPascalCase(str: string): string {
  // Check for custom mapping first
  if (CUSTOM_PASCAL_CASE_MAPPINGS[str]) {
    return CUSTOM_PASCAL_CASE_MAPPINGS[str]
  }

  // Default PascalCase conversion for other cases
  return str
    .split(/[_.-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
}

/**
 * Scans all plugin files to build a dynamic mapping of export names to plugin data.
 */
function scanPluginFiles(): Map<string, { target: string; client: string; title: string }> {
  console.log('Scanning plugin files dynamically...')

  const pluginsDir = resolve(__dirname, '../../../packages/snippetz/src/plugins')
  const pluginMap = new Map<string, { target: string; client: string; title: string }>()

  function scanDirectory(dir: string): void {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = resolve(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        scanDirectory(fullPath)
      } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
        try {
          const content = readFileSync(fullPath, 'utf-8')
          const pluginInfo = extractPluginInfo(content)
          if (pluginInfo) {
            pluginMap.set(pluginInfo.exportName, {
              target: pluginInfo.target,
              client: pluginInfo.client,
              title: pluginInfo.title,
            })
          }
        } catch (error) {
          console.warn(`Could not parse ${fullPath}:`, error)
        }
      }
    }
  }

  scanDirectory(pluginsDir)
  console.log(`Found ${pluginMap.size} plugins`)
  return pluginMap
}

/**
 * Extracts plugin information from a TypeScript file.
 */
function extractPluginInfo(
  content: string,
): { exportName: string; target: string; client: string; title: string } | null {
  const exportMatch = PATTERNS.PLUGIN_EXPORT.exec(content)
  if (!exportMatch) {
    return null
  }

  const [, exportName, target, client, title] = exportMatch
  if (!exportName || !target || !client || !title) {
    return null
  }

  return { exportName, target, client, title }
}

/**
 * Parses the clients.ts file to extract targets and clients information using dynamic plugin data.
 */
function parseClientsFile(): {
  targets: ImportedTarget[]
  allClients: Array<{ target: string; client: string; title: string }>
} {
  console.log('Parsing clients.ts file structure...')

  const clientsContent = readClientsFileContent()
  const pluginMap = scanPluginFiles()

  return extractTargetsAndClients(clientsContent, pluginMap)
}

function readClientsFileContent(): string {
  const clientsPath = resolve(__dirname, '../../../packages/snippetz/src/clients.ts')
  return readFileSync(clientsPath, 'utf-8')
}

function extractTargetsAndClients(
  content: string,
  pluginMap: Map<string, { target: string; client: string; title: string }>,
): { targets: ImportedTarget[]; allClients: Array<{ target: string; client: string; title: string }> } {
  const targets: ImportedTarget[] = []
  const allClientsMap = new Map<string, { target: string; client: string; title: string }>()

  let match
  while ((match = PATTERNS.TARGET_DEFINITION.exec(content)) !== null) {
    const target = parseTargetDefinition(match, pluginMap, allClientsMap)
    if (target) {
      targets.push(target)
    }
  }

  const allClients = Array.from(allClientsMap.values())
  console.log(`Parsed ${targets.length} targets from TypeScript`)
  console.log(`Found ${allClients.length} unique clients`)

  return { targets, allClients }
}

function parseTargetDefinition(
  match: RegExpExecArray,
  pluginMap: Map<string, { target: string; client: string; title: string }>,
  allClientsMap: Map<string, { target: string; client: string; title: string }>,
): ImportedTarget | null {
  const [, key, title, defaultClient, clientsStr] = match
  if (!key || !title || !defaultClient || !clientsStr) {
    return null
  }

  const clientImportNames = clientsStr.match(PATTERNS.CLIENT_IMPORT_NAMES) || []
  const targetClients: Array<{ target: string; client: string; title: string }> = []

  for (const importName of clientImportNames) {
    const pluginInfo = pluginMap.get(importName)
    if (pluginInfo) {
      targetClients.push(pluginInfo)
      // Use only client name as key to avoid duplicates across targets
      allClientsMap.set(pluginInfo.client, pluginInfo)
    } else {
      console.warn(`Plugin not found for import: ${importName}`)
    }
  }

  return {
    key,
    title,
    default: defaultClient,
    clients: targetClients,
  }
}

/**
 * Generates the ScalarTarget enum content.
 */
function generateScalarTargetEnum(targets: ImportedTarget[]): string {
  const enumValues = targets.map(createTargetEnumValue).join('\n\n')
  const header = createAutoGeneratedHeader()

  return `${header}

using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the different targets available in Scalar.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(ScalarTargetJsonConverter))]
public enum ScalarTarget
{
${enumValues}
}`
}

function createTargetEnumValue(target: ImportedTarget): string {
  const pascalCaseKey = toPascalCase(target.key)
  const description = `${target.title} programming language.`

  return `    /// <summary>
    /// ${description}
    /// </summary>
    [Description("${target.key}")]
    ${pascalCaseKey},`
}

/**
 * Generates the ScalarClient enum content.
 */
function generateScalarClientEnum(clients: Array<{ target: string; client: string; title: string }>): string {
  const enumValues = clients.map(createClientEnumValue).join('\n\n')
  const obsoleteEntries = createObsoleteClientEntries()
  const header = createAutoGeneratedHeader()

  return `${header}

using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the different clients available in Scalar.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(ScalarClientJsonConverter))]
public enum ScalarClient
{
${enumValues}${obsoleteEntries ? '\n\n' + obsoleteEntries : ''}
}`
}

function createClientEnumValue(client: { target: string; client: string; title: string }): string {
  const pascalCaseKey = toPascalCase(client.client)
  const description = `${client.title} client.`

  return `    /// <summary>
    /// ${description}
    /// </summary>
    [Description("${client.client}")]
    ${pascalCaseKey},`
}

/**
 * Generates the ClientOptions dictionary mapping.
 */
function generateClientOptionsMapping(targets: ImportedTarget[]): string {
  const mappingEntries = targets.map(createMappingEntry).join('\n')
  const header = createAutoGeneratedHeader()

  return `${header}

#pragma warning disable CS0618 // Type or member is obsolete 
namespace Scalar.AspNetCore;

/// <summary>
/// Auto-generated mapping between targets and their available clients.
/// This partial class extends ScalarOptionsMapper with the generated mapping.
/// </summary>
internal static partial class ScalarOptionsMapper
{
    /// <summary>
    /// Mapping of targets to their available clients.
    /// This dictionary is auto-generated from TypeScript clients configuration.
    /// </summary>
    internal static readonly Dictionary<ScalarTarget, ScalarClient[]> ClientOptions = new()
    {
${mappingEntries}
    };
}`
}

function createMappingEntry(target: ImportedTarget): string {
  const targetEnum = `ScalarTarget.${toPascalCase(target.key)}`
  const clientEnums = target.clients.map((client) => `ScalarClient.${toPascalCase(client.client)}`)

  // Add obsolete entries for backward compatibility
  const obsoleteClientEnums = OBSOLETE_CLIENT_ENTRIES.filter((obsolete) =>
    target.clients.some((client) => client.client === obsolete.description),
  ).map((obsolete) => `ScalarClient.${obsolete.name}`)

  const allClientEnums = [...clientEnums, ...obsoleteClientEnums].join(', ')

  return `        { ${targetEnum}, [${allClientEnums}] },`
}

function createAutoGeneratedHeader(): string {
  return `//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by the Scalar ASP.NET Core enum generator.
//     Source: /packages/snippetz/src/clients.ts
//     Command: pnpm generate:enums
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------`
}

/**
 * Creates obsolete client enum entries for backward compatibility.
 */
function createObsoleteClientEntries(): string {
  if (OBSOLETE_CLIENT_ENTRIES.length === 0) {
    return ''
  }

  return OBSOLETE_CLIENT_ENTRIES.map(
    (entry) => `    /// <summary>
    /// ${entry.reason}
    /// </summary>
    [Obsolete("${entry.reason}")]
    [Description("${entry.description}")]
    ${entry.name},`,
  ).join('\n\n')
}

/**
 * Main function to generate all the C# files.
 */
function main(): void {
  console.log('Generating C# enums from TypeScript clients...')

  try {
    // Parse all client information from the clients.ts file
    const { targets, allClients } = parseClientsFile()

    // Generate enums
    console.log('\nGenerating C# enums...')
    const scalarTargetEnum = generateScalarTargetEnum(targets)
    const scalarClientEnum = generateScalarClientEnum(allClients)
    const clientOptionsMapping = generateClientOptionsMapping(targets)

    // Write files
    const enumsDir = resolve(__dirname, '../src/Scalar.AspNetCore/Enums')
    const mapperDir = resolve(__dirname, '../src/Scalar.AspNetCore/Mapper')

    writeFileSync(resolve(enumsDir, 'ScalarTarget.Generated.cs'), scalarTargetEnum)
    writeFileSync(resolve(enumsDir, 'ScalarClient.Generated.cs'), scalarClientEnum)
    writeFileSync(resolve(mapperDir, 'ScalarOptionsMapper.Generated.cs'), clientOptionsMapping)

    console.log('\nSuccessfully generated:')
    console.log('  - ScalarTarget.Generated.cs')
    console.log('  - ScalarClient.Generated.cs')
    console.log('  - ScalarOptionsMapper.Generated.cs')
    console.log(`\nGenerated ${targets.length} targets and ${allClients.length} clients`)

    // Summary of what was found
    console.log('\nSummary:')
    targets.forEach((target) => {
      console.log(`  ${target.title} (${target.key}): ${target.clients.length} clients`)
    })
  } catch (error) {
    console.error('Error generating C# enums:', error)
    process.exit(1)
  }
}

// Run the generator
main()
