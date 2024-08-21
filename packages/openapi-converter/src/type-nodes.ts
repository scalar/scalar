import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type Program,
  SyntaxKind,
  type TypeNode,
  isArrayTypeNode,
  isImportSpecifier,
  isLiteralTypeNode,
  isNumericLiteral,
  isPropertySignature,
  isSourceFile,
  isStringLiteral,
  isTypeAliasDeclaration,
  isTypeLiteralNode,
  isTypeReferenceNode,
  isUnionTypeNode,
} from 'typescript'

/**
 * Traverse type nodes to create a schema file
 *
 * TODO:
 * - lots
 */
export const getSchemaFromTypeNode = (
  typeNode: TypeNode,
  program: Program,
  /** Takes in two file names and returns a string which resolves to a path for the targetsFileName */
  fileNameResolver: (sourceFileName: string, targetFileName: string) => string,
): OpenAPIV3_1.SchemaObject => {
  // String
  if (SyntaxKind.StringKeyword === typeNode.kind)
    return {
      type: 'string',
    }
  // Number
  else if (SyntaxKind.NumberKeyword === typeNode.kind)
    return {
      type: 'number',
    }
  else if (SyntaxKind.BooleanKeyword === typeNode.kind)
    return {
      type: 'boolean',
    }
  // Literal
  else if (isLiteralTypeNode(typeNode)) {
    // String
    if (isStringLiteral(typeNode.literal))
      return {
        type: 'string',
        example: typeNode.literal.text,
      }
    // Number
    else if (isNumericLiteral(typeNode.literal))
      return {
        type: 'number',
        example: Number(typeNode.literal.text),
      }
    // Boolean
    else if (
      SyntaxKind.TrueKeyword === typeNode.literal.kind ||
      SyntaxKind.FalseKeyword === typeNode.literal.kind
    )
      return {
        type: 'boolean',
        example: SyntaxKind.TrueKeyword === typeNode.literal.kind,
      }
  }
  // Array
  else if (isArrayTypeNode(typeNode)) {
    return {
      type: 'array',
      items: getSchemaFromTypeNode(
        typeNode.elementType,
        program,
        fileNameResolver,
      ),
    }
  }
  // Object
  else if (isTypeLiteralNode(typeNode)) {
    return {
      type: 'object',
      properties: typeNode.members.reduce((prev, member) => {
        return isPropertySignature(member) && member.type
          ? {
              ...prev,
              [member.name?.getText() ?? 'unkownKey']: getSchemaFromTypeNode(
                member.type,
                program,
                fileNameResolver,
              ),
            }
          : prev
      }, {}),
    }
  }
  // Union
  else if (isUnionTypeNode(typeNode)) {
    // If all numbers or strings do enum
    const anyOf: OpenAPIV3_1.SchemaObject[] = []
    const length = typeNode.types.length
    const literals: Record<string, OpenAPIV3_1.SchemaObject[]> = {
      string: [],
      number: [],
    }

    // We need to find a way to check for enum vs oneOf
    typeNode.types.forEach((type) => {
      const schema = getSchemaFromTypeNode(type, program, fileNameResolver)
      if (isLiteralTypeNode(type)) literals[schema.type as string].push(schema)
      anyOf.push(schema)
    })

    // Enum if all literals
    if (literals.string.length === length)
      return {
        type: 'string',
        enum: literals.string.map((literal) => literal.example),
      }
    // All numbers
    else if (literals.number.length === length)
      return {
        type: 'number',
        enum: literals.number.map((literal) => literal.example),
      }
    // Mixed anyOf
    else
      return {
        anyOf,
      }
  }
  // Intersection
  // Type reference
  else if (isTypeReferenceNode(typeNode)) {
    const typeChecker = program.getTypeChecker()
    const symbol = typeChecker.getSymbolAtLocation(typeNode.typeName)
    if (symbol) {
      const name = symbol.escapedName

      // Get declarations from the symbol
      const declarations = symbol.getDeclarations()

      if (declarations && declarations.length > 0) {
        for (const declaration of declarations) {
          // Reference in same file aka type alias
          if (isTypeAliasDeclaration(declaration))
            return getSchemaFromTypeNode(
              declaration.type,
              program,
              fileNameResolver,
            )
          // For a reference in another file
          else if (isImportSpecifier(declaration)) {
            const declarationSourceFile = declaration.getSourceFile()
            const moduleSpecifier =
              declaration.parent.parent.parent.moduleSpecifier

            // Use external fileNameResolver
            if (
              isSourceFile(declarationSourceFile) &&
              isStringLiteral(moduleSpecifier)
            ) {
              const targetPath = fileNameResolver(
                declarationSourceFile.fileName,
                moduleSpecifier.text,
              )
              const targetSourceFile = program.getSourceFile(targetPath)

              // Keeping it ultra basic for now and just checking top level typeAliases
              if (targetSourceFile && isSourceFile(targetSourceFile))
                for (const statement of targetSourceFile.statements)
                  if (
                    isTypeAliasDeclaration(statement) &&
                    statement.name.escapedText === name
                  )
                    return getSchemaFromTypeNode(
                      statement.type,
                      program,
                      fileNameResolver,
                    )
            }
          }
        }
      }
    }
  }

  return {
    type: 'string',
    description: `TODO this type is not handled yet: ${SyntaxKind[typeNode.kind]}`,
  }
}
