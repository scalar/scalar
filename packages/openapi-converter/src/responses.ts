import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type Node,
  type Program,
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isReturnStatement,
} from 'typescript'

import { getReturnStatements } from './return-statements'
import { getSchemaFromTypeNode } from './type-nodes'
import type { FileNameResolver } from './types'

/** Convert the generator results to response objects */
export const generateResponses = (
  node: Node,
  program: Program,
  fileNameResolver: FileNameResolver,
) => {
  const generator = getReturnStatements(node)
  const statements = Array.from(generator)

  return statements.reduce<OpenAPIV3_1.ResponsesObject>((prev, statement) => {
    // Check for a Response.json
    if (
      isReturnStatement(statement) &&
      statement.expression &&
      isCallExpression(statement.expression) &&
      statement.expression.expression &&
      isPropertyAccessExpression(statement.expression.expression) &&
      statement.expression.expression.name.escapedText === 'json' &&
      statement.expression.expression.expression &&
      isIdentifier(statement.expression.expression.expression) &&
      (statement.expression.expression.expression.escapedText === 'Response' ||
        statement.expression.expression.expression.escapedText ===
          'NextResponse')
    ) {
      const [payload, resp] = statement.expression.arguments
      let status = 200
      let schema: OpenAPIV3_1.SchemaObject = {}

      // Check the type of the payload
      if (payload) {
        schema = getSchemaFromTypeNode(payload, program, fileNameResolver)
      }
      // Update the status
      // TODO headers, statusText
      if (resp && isObjectLiteralExpression(resp)) {
        const respSchema = getSchemaFromTypeNode(
          resp.properties[0],
          program,
          fileNameResolver,
        )
        status = respSchema.example
      }

      return {
        ...prev,
        [String(status)]: {
          description:
            'TODO grab this from jsDoc or use set defaults per status',
          content: {
            'application/json': {
              schema,
              // example
              // examples
              // encoding
            },
          },
        },
      }
    }
    // Other types of returns
    // arrow
    // new Response with types
    else {
      console.log('TODO other types of returns')

      return prev
    }
  }, {})
}
