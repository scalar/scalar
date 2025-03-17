// @ts-nocheck
// TODO remove this when we come back to this file
import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type Node,
  type PrefixUnaryOperator,
  SyntaxKind,
  type TypeChecker,
  type UnaryExpression,
  type VariableDeclaration,
  isArrayLiteralExpression,
  isAsExpression,
  isBigIntLiteral,
  isCallExpression,
  isIdentifier,
  isLiteralTypeLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPrefixUnaryExpression,
  isPropertyAssignment,
  isStringLiteral,
  isVariableDeclaration,
} from 'typescript'

/** Add a sign to negative numbers */
const signNumber = (operator: PrefixUnaryOperator, operand: UnaryExpression) =>
  operator === SyntaxKind.MinusToken && isNumericLiteral(operand) ? -1 * Number(operand.text) : operand

/**
 * Traverse nodes to create a schema
 *
 * If we used as const and they were all static values, we could just use the already existing getSchemaFromType
 * method. However when dealing with non constant values we can no longer use the type to generate the schema
 */
export const getSchemaFromNode = (node: Node, typeChecker: TypeChecker): OpenAPIV3_1.SchemaObject => {
  if (!node) {
    throw 'A node must be provided to the getSchemaFromNode function'
  }

  // As expression
  if (isAsExpression(node)) {
    return getSchemaFromNode(node.expression, typeChecker)
  }
  // String literal
  if (isStringLiteral(node)) {
    return {
      type: 'string',
      example: node.text,
    }
  }
  // Number
  if (isNumericLiteral(node)) {
    return {
      type: 'number',
      example: Number(node.text),
    }
  }
  // BigInt
  if (isBigIntLiteral(node)) {
    return { type: 'integer', example: node.text }
  }
  // Boolean and null
  if (isLiteralTypeLiteral(node)) {
    // Boolean
    if (SyntaxKind.FalseKeyword === node.kind || SyntaxKind.TrueKeyword === node.kind) {
      return { type: 'boolean', example: SyntaxKind.TrueKeyword === node.kind }
    }
    // Null
    if (SyntaxKind.NullKeyword === node.kind) {
      return { type: 'null', example: null }
    }
    // Negative nums
    if (isPrefixUnaryExpression(node)) {
      return {
        type: 'number',
        example: signNumber(node.operator, node.operand),
      }
    }
  }

  // Identifier
  else if (isIdentifier(node)) {
    const text = node.escapedText
    if (text === 'undefined') {
      return {
        type: 'string',
        description: 'This value was undefined',
      }
    }
    // Grab the type of the variable

    const symbol = typeChecker.getSymbolAtLocation(node)
    const declarations = symbol?.declarations

    // Find the first declaration for one that matches the name
    if (declarations?.length) {
      const varDeclaration = declarations.find(
        (declaration) =>
          isVariableDeclaration(declaration) && isIdentifier(declaration.name) && declaration.name.escapedText === text,
      ) as VariableDeclaration

      if (varDeclaration.initializer) {
        return getSchemaFromNode(varDeclaration.initializer, typeChecker)
      }
    }
  }
  // Array
  else if (isArrayLiteralExpression(node)) {
    return {
      type: 'array',
      example: node.elements.map((elem) => getSchemaFromNode(elem, typeChecker).example),
      // Not sure how the spec handles mixed arrays
      items: node.elements.map((element) => getSchemaFromNode(element, typeChecker))[0],
    }
  }
  // Property assignment
  else if (isPropertyAssignment(node)) {
    return getSchemaFromNode(node.initializer, typeChecker)
  }
  // Object
  else if (isObjectLiteralExpression(node)) {
    return {
      type: 'object',
      properties: node.properties.reduce((prev, property) => {
        const key = property.name && isIdentifier(property.name) ? (property.name.escapedText ?? 'unkown') : 'unknown'
        return {
          ...prev,
          [key]: getSchemaFromNode(property, typeChecker),
        }
      }, {}),
    }
  }
  // Call expression
  else if (isCallExpression(node)) {
    // BigInt
    if (isIdentifier(node.expression) && node.expression.escapedText === 'BigInt') {
      return {
        type: 'integer',
        example: node.arguments[0].getText() + 'n',
      }
    }
  }

  // To be added/handled
  return {
    type: 'null',
    description: 'TODO: This is an unknown type',
  }
}
