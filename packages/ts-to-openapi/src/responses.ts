// @ts-nocheck
// TODO remove this when we come back to this file
import type { OpenAPIV3_1 } from 'openapi-types'
import {
  type Expression,
  type Node,
  type ReturnStatement,
  SyntaxKind,
  type TypeChecker,
  isArrowFunction,
  isBlock,
  isCallExpression,
  isCaseClause,
  isConstructorDeclaration,
  isDefaultClause,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isIfStatement,
  isMethodDeclaration,
  isPropertyAccessExpression,
  isReturnStatement,
  isSwitchStatement,
  isTryStatement,
  isWhileStatement,
} from 'typescript'

import { getSchemaFromNode } from './node'

/**
 * Generator to grab all nested return statements from a node
 *
 * @see https://stackoverflow.com/a/76551960
 */
export function* getReturnStatements(node: Node): Generator<ReturnStatement | Expression> {
  // Got the return statement
  if (isReturnStatement(node)) {
    yield node
  } else if (isBlock(node) || isCaseClause(node) || isDefaultClause(node)) {
    for (const stmt of node.statements) {
      yield* getReturnStatements(stmt)
    }
  } else if (isIfStatement(node)) {
    yield* getReturnStatements(node.thenStatement)
    if (node.elseStatement) {
      yield* getReturnStatements(node.elseStatement)
    }
  } else if (isForStatement(node) || isForOfStatement(node) || isForInStatement(node) || isWhileStatement(node)) {
    yield* getReturnStatements(node.statement)
  } else if (isSwitchStatement(node)) {
    for (const clause of node.caseBlock.clauses) {
      yield* getReturnStatements(clause)
    }
  } else if (isTryStatement(node)) {
    yield* getReturnStatements(node.tryBlock)
    if (node.catchClause) {
      yield* getReturnStatements(node.catchClause.block)
    }
    if (node.finallyBlock) {
      yield* getReturnStatements(node.finallyBlock)
    }
  } else if (
    isMethodDeclaration(node) ||
    isFunctionDeclaration(node) ||
    isArrowFunction(node) ||
    isFunctionExpression(node) ||
    isConstructorDeclaration(node)
  ) {
    if (node.body) {
      if (isBlock(node.body)) {
        yield* getReturnStatements(node.body)
      } else {
        yield node.body
      }
    }
  }
}

/**
 * Convert the generator results to response schema objects
 *
 * TODO:
 * - other types besides json
 * - grab jsDoc
 * - pass in a predicate as this if statement is meant for next
 */
export const generateResponses = (node: Node | undefined, typeChecker: TypeChecker): OpenAPIV3_1.ResponsesObject => {
  if (!node) {
    return {}
  }

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
      // we will probably pass comparator in
      (statement.expression.expression.expression.escapedText === 'Response' ||
        statement.expression.expression.expression.escapedText === 'NextResponse')
    ) {
      const [payload, options] = statement.expression.arguments

      // Grab payload and options schemas
      const schema = getSchemaFromNode(payload, typeChecker)
      const optionsSchema = options ? getSchemaFromNode(options, typeChecker) : null
      const status = (optionsSchema?.properties?.status as OpenAPIV3_1.SchemaObject)?.example ?? 200

      if (status) {
        return {
          ...prev,
          [String(status)]: {
            description: 'TODO: grab this from jsdoc and add a default',
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
    }
    return {
      ...prev,
      unknown: {
        description: 'unknown return type: ' + SyntaxKind[statement.kind],
        content: { 'application/json': {} },
      },
    }
  }, {})
}
