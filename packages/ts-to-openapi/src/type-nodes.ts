// @ts-nocheck
// TODO remove this when we come back to this file
import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type Program,
  SyntaxKind,
  type TypeNode,
  isArrayTypeNode,
  isBigIntLiteral,
  isIdentifier,
  isImportSpecifier,
  isIntersectionTypeNode,
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

import type { FileNameResolver, Literals } from './types'

/**
 * Traverse type nodes to create schemas
 *
 * TODO:
 * - sort out null
 * - if null is in the union, set nullable: true
 * - required vs optional
 * - defaults (grab from the actual value)
 * - jsdoc
 */
export const getSchemaFromTypeNode = (
  typeNode: TypeNode,
  program: Program,
  fileNameResolver: FileNameResolver,
): OpenAPIV3_1.SchemaObject => {
  // String
  if (SyntaxKind.StringKeyword === typeNode.kind) {
    return {
      type: 'string',
    }
  }
  // Number
  if (SyntaxKind.NumberKeyword === typeNode.kind) {
    return {
      type: 'number',
    }
  }
  // Boolean
  if (SyntaxKind.BooleanKeyword === typeNode.kind) {
    return {
      type: 'boolean',
    }
  }
  // BigInt
  if (SyntaxKind.BigIntKeyword === typeNode.kind) {
    return {
      type: 'integer',
    }
  }
  // Object
  if (SyntaxKind.ObjectKeyword === typeNode.kind) {
    return {
      type: 'object',
    }
  }
  // Any - can be any type
  if (SyntaxKind.AnyKeyword === typeNode.kind) {
    return {
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'integer' },
        { type: 'boolean' },
        { type: 'object' },
        { type: 'array', items: {} },
      ],
    }
  }
  // Literal
  if (isLiteralTypeNode(typeNode)) {
    // String
    if (isStringLiteral(typeNode.literal)) {
      return {
        type: 'string',
        example: typeNode.literal.text,
      }
    }
    // Number
    if (isNumericLiteral(typeNode.literal)) {
      return {
        type: 'number',
        example: Number(typeNode.literal.text),
      }
    }
    // Boolean
    if (SyntaxKind.TrueKeyword === typeNode.literal.kind || SyntaxKind.FalseKeyword === typeNode.literal.kind) {
      return {
        type: 'boolean',
        example: SyntaxKind.TrueKeyword === typeNode.literal.kind,
      }
    }
    if (SyntaxKind.NullKeyword === typeNode.literal.kind) {
      return {
        type: 'null',
        example: null,
      }
    }
    if (isBigIntLiteral(typeNode.literal)) {
      return {
        type: 'integer',
        example: typeNode.literal.text,
      }
    }
  }
  // TypeQuery
  // else if (isTypeQueryNode(typeNode)) {
  //   console.log(typeNode.exprName)
  // }
  // Array
  else if (isArrayTypeNode(typeNode)) {
    return {
      type: 'array',
      items: getSchemaFromTypeNode(typeNode.elementType, program, fileNameResolver),
    }
  }
  // Object
  else if (isTypeLiteralNode(typeNode)) {
    return {
      type: 'object',
      properties: typeNode.members.reduce((prev, member) => {
        // Regular properties
        if (isPropertySignature(member) && member.type && isIdentifier(member.name)) {
          // console.log(typeNode)
          return {
            ...prev,
            [member.name?.escapedText ?? 'unkownKey']: getSchemaFromTypeNode(member.type, program, fileNameResolver),
          }
        }
        // Index Signatures
        // else if (isIndexSignatureDeclaration(member)) {
        //   return {
        //     type: 'string',
        //     description: `TODO this type is not handled yet: ${SyntaxKind[member.kind]}`,
        //   }

        return {
          ...prev,
          type: 'string',
          description: `TODO this type is not handled yet: ${SyntaxKind[member.kind]}`,
        }
      }, {}),
    }
  }
  // Union
  else if (isUnionTypeNode(typeNode)) {
    // If all numbers or strings do enum
    const anyOf: OpenAPIV3_1.SchemaObject[] = []
    const length = typeNode.types.length
    const literals: Record<Literals, OpenAPIV3_1.SchemaObject[]> = {
      string: [],
      number: [],
      boolean: [],
    }

    // We need to find a way to check for enum vs oneOf
    typeNode.types.forEach((type) => {
      const schema = getSchemaFromTypeNode(type, program, fileNameResolver)
      if (isLiteralTypeNode(type)) {
        literals[schema.type as Literals].push(schema)
      }
      anyOf.push(schema)
    })

    // Enum if all literals
    if (literals.string.length === length) {
      return {
        type: 'string',
        enum: literals.string.map((literal) => literal.example),
      }
    }
    // All numbers
    if (literals.number.length === length) {
      return {
        type: 'number',
        enum: literals.number.map((literal) => literal.example),
      }
    }
    // All booleans
    if (literals.boolean.length === length) {
      return {
        type: 'boolean',
        enum: literals.boolean.map((literal) => literal.example),
      }
    }
    // Mixed anyOf

    return {
      anyOf,
    }
  }
  // Intersection
  else if (isIntersectionTypeNode(typeNode)) {
    return {
      allOf: typeNode.types.map((type) => getSchemaFromTypeNode(type, program, fileNameResolver)),
    }
  }
  // Type reference
  else if (isTypeReferenceNode(typeNode) && isIdentifier(typeNode.typeName)) {
    const typeChecker = program.getTypeChecker()
    const symbol = typeChecker.getSymbolAtLocation(typeNode.typeName)

    // Array<type>
    if (typeNode.typeName.escapedText === 'Array') {
      return {
        type: 'array',
        items: typeNode.typeArguments?.length
          ? getSchemaFromTypeNode(typeNode.typeArguments?.[0], program, fileNameResolver)
          : {},
      }
    }
    if (symbol) {
      const name = symbol.escapedName

      // Get declarations from the symbol
      const declarations = symbol.getDeclarations()

      if (declarations && declarations.length > 0) {
        for (const declaration of declarations) {
          // Reference in same file aka type alias
          if (isTypeAliasDeclaration(declaration)) {
            return getSchemaFromTypeNode(declaration.type, program, fileNameResolver)
          }
          // For a reference in another file
          if (isImportSpecifier(declaration)) {
            const declarationSourceFile = declaration.getSourceFile()
            const moduleSpecifier = declaration.parent.parent.parent.moduleSpecifier

            // Use external fileNameResolver
            if (isSourceFile(declarationSourceFile) && isStringLiteral(moduleSpecifier)) {
              const targetPath = fileNameResolver(declarationSourceFile.fileName, moduleSpecifier.text)
              const targetSourceFile = program.getSourceFile(targetPath)

              // Keeping it ultra basic for now and just checking top level typeAliases
              if (targetSourceFile && isSourceFile(targetSourceFile)) {
                for (const statement of targetSourceFile.statements) {
                  if (isTypeAliasDeclaration(statement) && statement.name.escapedText === name) {
                    return getSchemaFromTypeNode(statement.type, program, fileNameResolver)
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    type: 'null',
    description: `TODO this type is not handled yet: ${SyntaxKind[typeNode.kind]}`,
  }
}
