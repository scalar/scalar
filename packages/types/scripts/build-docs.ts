import * as fs from 'node:fs'
import * as path from 'node:path'
import ts from 'typescript'

const INPUT_FILE = '../src/legacy/reference-config.ts'
const TYPE_NAME = 'ReferenceConfiguration'
const OUTPUT_FILE = '../docs/reference-configuration.md'

const HEADLINE = 'Configuration'
const INTRODUCTION =
  'There’s a universal configuration object that can be used on all platforms.'

let markdown = `# ${HEADLINE}\n\n${INTRODUCTION}\n\n`

function generateTypeDocumentation() {
  const startTime = performance.now()

  const filePath = path.join(__dirname, INPUT_FILE)
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )

  markdown += `## ${TYPE_NAME}\n\n`

  // Find the ReferenceConfiguration type
  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node) && node.name.getText() === TYPE_NAME) {
      if (ts.isTypeLiteralNode(node.type)) {
        // Sort members alphabetically by name
        const sortedMembers = [...node.type.members].sort((a, b) => {
          const nameA = a.name?.getText() || ''
          const nameB = b.name?.getText() || ''
          return nameA.localeCompare(nameB)
        })

        sortedMembers.forEach((member) => {
          if (ts.isPropertySignature(member)) {
            const name = member.name.getText()

            // Skip properties that start with underscore
            if (name.startsWith('_')) return

            // Add question mark if property is optional
            const displayName = member.questionToken ? `${name}?` : name
            const type = member.type?.getText() || 'unknown'

            // Check if type is a union type
            const isUnionType = member.type && ts.isUnionTypeNode(member.type)

            // For union types, only show the property name in heading
            const displayNameWithType = isUnionType
              ? displayName
              : `${displayName}: ${type}`

            // Get JSDoc comment if it exists
            const jsDoc = ts
              .getJSDocCommentsAndTags(member)
              .map((doc) => doc.getText())
              .join('\n')
              .replace(/\/\*\*|\*\/|\*/g, '')
              .trim()

            // Extract @default value using AST
            const defaultTag = ts
              .getJSDocTags(member)
              .find((tag) => tag.tagName.getText() === 'default')
            const defaultValue = defaultTag?.comment || null

            // Extract @deprecated value using AST
            const deprecatedTag = ts
              .getJSDocTags(member)
              .find((tag) => tag.tagName.getText() === 'deprecated')
            const deprecatedValue = deprecatedTag?.comment || null

            // Check for @deprecated tag
            const hasDeprecatedTag = ts
              .getJSDocTags(member)
              .some((tag) => tag.tagName.getText() === 'deprecated')

            // Add strikethrough if @deprecated tag exists
            markdown += hasDeprecatedTag
              ? `## ~~${displayNameWithType}~~\n\n`
              : `## ${displayNameWithType}\n\n`

            if (deprecatedValue) {
              markdown += `**Deprecated:** ${deprecatedValue}\n\n`
            }

            if (jsDoc) {
              // Filter out lines starting with @ and trim whitespace
              const filteredJsDoc = jsDoc
                .split('\n')
                .filter((line) => !line.trim().startsWith('@'))
                .join('\n')
                .trim()

              if (filteredJsDoc) {
                markdown += `${filteredJsDoc}\n\n`
              }
            }
            if (defaultValue) {
              markdown += `**Default:** \`${defaultValue}\`\n\n`
            }

            // Add union type values as bullet list if applicable
            if (isUnionType && member.type) {
              markdown += '**Values:**\n\n'
              member.type.types.forEach((typeNode) => {
                markdown += `- \`${typeNode.getText()}\`\n`
              })
              markdown += '\n'
            }
          }
        })
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // Create docs directory if it doesn't exist
  const docsDir = path.join(__dirname, '../docs')
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  // Write the markdown file
  const outputPath = path.join(__dirname, OUTPUT_FILE)
  fs.writeFileSync(outputPath, markdown)

  const endTime = performance.now()
  const executionTime = ((endTime - startTime) / 1000).toFixed(2)

  console.log('Documentation Generation')
  console.log(`
🔤 Type:           ${TYPE_NAME}
📄 Input:          ${path.relative(__dirname, sourceFile.fileName)}
📂 Output:         ${path.relative(__dirname, outputPath)}
⏱ Execution Time:  ${executionTime}s
`)
}

generateTypeDocumentation()
