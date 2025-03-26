import { describe, expect, it } from 'vitest'

import { RuntimeExpressionSchema } from '../unprocessed/runtime-expression'

describe('RuntimeExpressionSchema', () => {
  describe('validation', () => {
    // Valid expressions
    const validExpressions = [
      {
        expression: '$url',
        description: 'validates $url expression',
      },
      {
        expression: '$method',
        description: 'validates $method expression',
      },
      {
        expression: '$statusCode',
        description: 'validates $statusCode expression',
      },
      {
        expression: '$request.path.id',
        description: 'validates path parameter reference',
      },
      {
        expression: '$request.query.filter',
        description: 'validates query parameter reference',
      },
      {
        expression: '$request.header.X-Custom-Header',
        description: 'validates header reference',
      },
      {
        expression: '$request.body#/user/id',
        description: 'validates body reference with JSON pointer',
      },
      {
        expression: '$response.header.Content-Type',
        description: 'validates response header reference',
      },
      {
        expression: '$response.body#/status',
        description: 'validates response body reference with JSON pointer',
      },
      {
        expression: 'http://notificationServer.com?transactionId={$request.body#/id}&email={$request.body#/email}',
        description: 'validates URL with runtime expressions',
      },
      {
        expression: '{$request.query.queryUrl}',
        description: 'validates URL with runtime expressions',
      },
    ]

    validExpressions.forEach(({ expression, description }) => {
      it(description, () => {
        expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(true)
      })
    })

    // Invalid expressions
    const invalidExpressions = [
      {
        expression: 'invalid',
        description: 'rejects expression without $ prefix',
      },
      {
        expression: '$invalid',
        description: 'rejects unknown runtime expression',
      },
      {
        expression: '$request.invalid.field',
        description: 'rejects invalid request field reference',
      },
      {
        expression: '$response.invalid.field',
        description: 'rejects invalid response field reference',
      },
      {
        expression: '$request.body#invalid-pointer',
        description: 'rejects invalid JSON pointer syntax',
      },
      {
        expression: '',
        description: 'rejects empty string',
      },
    ]

    invalidExpressions.forEach(({ expression, description }) => {
      it(description, () => {
        expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(false)
      })
    })
  })

  describe('complex expressions', () => {
    it('validates nested JSON pointers', () => {
      const expression = '$request.body#/user/addresses/0/street'
      expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(true)
    })

    it('validates case-sensitive header names', () => {
      const expression = '$request.header.Content-Type'
      expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(true)
    })

    it('validates expressions with special characters in JSON pointers', () => {
      const expression = '$response.body#/data/special~1field/value'
      expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('validates empty JSON pointer', () => {
      const expression = '$request.body#'
      expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(true)
    })

    it('validates root JSON pointer', () => {
      const expression = '$response.body#/'
      expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(true)
    })

    it('handles whitespace in header names', () => {
      const expression = '$request.header.X-Custom Header'
      expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(false)
    })
  })

  describe('embedded expressions', () => {
    const validEmbeddedExpressions = [
      {
        expression: 'Hello {$request.body#/name}!',
        description: 'validates simple embedded expression',
      },
      {
        expression: 'User {$request.path.id} updated at {$request.body#/timestamp}',
        description: 'validates multiple embedded expressions',
      },
      {
        expression: 'Status: {$statusCode}',
        description: 'validates embedded system variable',
      },
      {
        expression: '{$request.header.Authorization}',
        description: 'validates single embedded expression',
      },
      {
        expression: 'Content-Type is: {$response.header.Content-Type}',
        description: 'validates embedded header reference',
      },
    ]

    validEmbeddedExpressions.forEach(({ expression, description }) => {
      it(description, () => {
        expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(true)
      })
    })

    const invalidEmbeddedExpressions = [
      {
        expression: 'Missing closing brace {$request.body#/name',
        description: 'rejects unclosed embedded expression',
      },
      {
        expression: 'Missing opening brace $request.body#/name}',
        description: 'rejects unopened embedded expression',
      },
      {
        expression: 'Empty braces {}',
        description: 'rejects empty embedded expression',
      },
    ]

    invalidEmbeddedExpressions.forEach(({ expression, description }) => {
      it(description, () => {
        expect(RuntimeExpressionSchema.safeParse(expression).success).toBe(false)
      })
    })
  })
})
