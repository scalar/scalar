import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type Node,
  type Program,
  SyntaxKind,
  type TypeChecker,
  isArrayLiteralExpression,
  isAsExpression,
  isIdentifier,
  isLiteralTypeLiteral,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteral,
} from 'typescript'

import { getSchemaFromTypeNode } from './type-nodes'
import type { FileNameResolver } from './types'

/**
 * Reverse traverses up the tree checking for symbols which match the identifier to get the value of a variable
 */
export const getValueFromIdentifier = () => {}

/**
 * Traverse nodes to create a schema
 *
 * If we used as const and they were all static values, we could just use the already existing getSchemaFromType
 * method. However when dealing with non constant values we can no longer use the type to generate the schema
 */
export const getSchemaFromNode = (node: Node): OpenAPIV3_1.SchemaObject => {
  // const text = node.getText()

  // As expression
  if (isAsExpression(node)) return getSchemaFromNode(node.expression)
  // String literal
  else if (isStringLiteral(node))
    return {
      type: 'string',
      example: node.text,
    }
  // Number
  else if (isNumericLiteral(node))
    return {
      type: 'number',
      example: Number(node.text),
    }
  // Boolean and null
  // else if (isLiteralTypeLiteral(node))
  //   if (text === 'null') {
  //     // Not sure if null is even a type
  //     return { type: 'null', example: null }
  //   } else {
  //     const bool = Boolean(text)
  //     return { type: 'boolean', example: bool }
  //   }
  // // Identifier
  // else if (isIdentifier(node)) {
  //   if (text === 'undefined')
  //     return {
  //       type: 'string',
  //       description: 'This value was undefined',
  //     }
  //   // Grab the type of the variable
  //   // TODO: Reverse traverse and find the symbol
  //   else {
  //     // console.log(program.getTypeChecker().getSymbolAtLocation(node))
  //   }
  //   // return getSchemaFromTypeNode(
  //   //   program.getTypeChecker().getTypeAtLocation(node),
  //   //   program,
  //   //   fileNameResolver,
  //   // )
  // }
  // Array
  else if (isArrayLiteralExpression(node))
    return {
      type: 'array',
      example: node.elements.map((elem) => getSchemaFromNode(elem).example),
      // Not sure how the spec handles mixed arrays
      items: node.elements.map((element) => getSchemaFromNode(element))[0],
    }
  // Property assignment
  else if (isPropertyAssignment(node))
    return getSchemaFromNode(node.initializer)
  // Object
  else if (isObjectLiteralExpression(node))
    return {
      type: 'object',
      properties: node.properties.reduce((prev, property) => {
        const key =
          property.name && isIdentifier(property.name)
            ? property.name.escapedText ?? 'unkown'
            : 'unknown'
        return {
          ...prev,
          [key]: getSchemaFromNode(property),
        }
      }, {}),
    }

  // To be added/handled
  return {
    type: 'null',
    description: 'TODO: This is an unknown type',
  }
}
