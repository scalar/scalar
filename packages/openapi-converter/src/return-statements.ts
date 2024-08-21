import {
  type Expression,
  type Node,
  type ReturnStatement,
  isArrowFunction,
  isBlock,
  isCaseClause,
  isConstructorDeclaration,
  isDefaultClause,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionDeclaration,
  isFunctionExpression,
  isIfStatement,
  isMethodDeclaration,
  isReturnStatement,
  isSwitchStatement,
  isTryStatement,
  isWhileStatement,
} from 'typescript'

/**
 * Generator to grab all nested return statements from a node
 *
 * @see https://stackoverflow.com/a/76551960
 */
export function* getReturnStatements(
  node: Node,
): Generator<ReturnStatement | Expression> {
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
  } else if (
    isForStatement(node) ||
    isForOfStatement(node) ||
    isForInStatement(node) ||
    isWhileStatement(node)
  ) {
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
