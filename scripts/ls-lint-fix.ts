import { readFileSync, renameSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { globSync } from 'glob'
import { parse } from 'yaml'

type CaseRule = 'kebab-case' | 'PascalCase' | string

// Function to convert string based on rule
function convertCase(str: string, rule: CaseRule): string {
  // Special case for index.* files - always lowercase
  if (str.toLowerCase().startsWith('index.')) {
    return str.toLowerCase()
  }

  // Handle regex rules (e.g. regex:${0})
  if (rule.startsWith('regex:')) {
    // TODO: Write the logic once we need regex rules
    console.warn(`We didn't implement regex rules yet for ${str}`)
    return str
  }

  switch (rule) {
    case 'kebab-case': {
      const result = str
        // Handle special case for .test.ts files
        .replace(/\.test\.ts$/, (match) => match)
        // Convert underscores to hyphens
        .replace(/_/g, '-')
        // Convert camelCase/PascalCase to kebab-case
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase()
      return result
    }

    case 'PascalCase': {
      // Convert kebab-case to PascalCase
      const result = str
        // Handle special case for .test.ts files
        .replace(/\.test\.ts$/, (match) => match)
        // Convert kebab-case to PascalCase
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        // Ensure first letter is uppercase
        .replace(/^[a-z]/, (letter) => letter.toUpperCase())
      return result
    }

    case 'camelCase': {
      // Convert kebab-case to camelCase
      const result = str
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        .replace(/^[A-Z]/, (letter) => letter.toLowerCase())
      return result
    }

    default:
      return str
  }
}

// Function to safely rename a file
function safeRename(oldPath: string, newPath: string, rule: CaseRule) {
  try {
    if (oldPath !== newPath) {
      console.log(`${basename(oldPath)} -> ${basename(newPath)} (${rule})`)
      renameSync(oldPath, newPath)
    }
  } catch (error) {
    console.error(`Error renaming ${oldPath}: ${error}`)
  }
}

// Function to get rule for a file based on its path and extension
function getRuleForFile(config: any, filePath: string, extension: string): CaseRule | null {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const matchingRules: Array<{ pattern: string; rule: CaseRule }> = []

  // Find all matching configurations
  for (const [pattern, rules] of Object.entries(config.ls)) {
    const fullPattern = `${pattern}/**/*${extension}`
    const matches = globSync(fullPattern, {
      dot: true,
      absolute: true,
    })

    if (matches.some((match) => match === normalizedPath)) {
      const ruleSet = rules as any
      if (ruleSet[extension]) {
        matchingRules.push({
          pattern,
          rule: ruleSet[extension] as CaseRule,
        })
      }
    }
  }

  // Sort by pattern specificity (more segments = more specific)
  matchingRules.sort((a, b) => {
    const aSegments = a.pattern.split('/').length
    const bSegments = b.pattern.split('/').length
    return bSegments - aSegments
  })

  // Return the most specific matching rule, or null if no matches
  return matchingRules[0]?.rule ?? null
}

// Main function to process file renaming
function renameFiles(config: any) {
  // Get all patterns from config
  const patterns = Object.keys(config.ls).map((pattern) => {
    const extensions = Object.keys(config.ls[pattern])
      .filter((key) => key.startsWith('.'))
      .map((ext) => ext.substring(1))
      .join(',')

    const result = pattern.includes('*') ? `${pattern}/*.{${extensions}}` : `${pattern}/**/*.{${extensions}}`
    return result
  })

  // Get all matching files
  const files = patterns.flatMap((pattern) =>
    globSync(pattern, {
      ignore: config.ignore || [],
      absolute: true,
    }),
  )

  // Process each file
  files.forEach((filePath) => {
    const dir = dirname(filePath)
    const file = basename(filePath)
    const extension = '.' + file.split('.').slice(1).join('.')
    const rule = getRuleForFile(config, filePath, extension)

    if (rule) {
      const newName = convertCase(file, rule)
      const newPath = join(dir, newName)
      safeRename(filePath, newPath, rule)
    }
  })
}

// Read config and start renaming
console.log('Reading configuration file…')

const configPath = resolve(process.cwd(), '.ls-lint.yml')
const config = parse(readFileSync(configPath, 'utf8'))

console.log('Configuration loaded.')
console.log()

renameFiles(config)
