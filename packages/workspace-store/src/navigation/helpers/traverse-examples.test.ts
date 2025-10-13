import { describe, expect, it } from 'vitest'

import type { OperationObject } from '@/schemas/v3.1/strict/openapi-document'

import { traverseOperationExamples } from './traverse-examples'

describe('traverseOperationExamples', () => {
  it('returns empty array for empty operation object', () => {
    const operation: OperationObject = {
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual([])
  })

  it('extracts examples from request body', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            examples: {
              example1: {
                value: { id: 1 },
              },
              example2: {
                value: { id: 2 },
              },
            },
          },
        },
      },
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual(['example1', 'example2'])
  })

  it('extracts examples from request body with multiple media types', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            examples: {
              jsonExample: {
                value: { id: 1 },
              },
            },
          },
          'application/xml': {
            examples: {
              xmlExample: {
                value: '<root></root>',
              },
            },
          },
        },
      },
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toHaveLength(2)
    expect(result).toContain('jsonExample')
    expect(result).toContain('xmlExample')
  })

  it('handles request body with $ref', () => {
    const operation: OperationObject = {
      requestBody: {
        $ref: '#/components/requestBodies/RequestBody',
        '$ref-value': {
          content: {
            'application/json': {
              examples: {
                refExample: {
                  value: { id: 1 },
                },
              },
            },
          },
        },
      },
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual(['refExample'])
  })

  it('handles request body without content', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {},
      },
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual([])
  })

  it('handles request body with content but no examples', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual([])
  })

  it('extracts examples from parameter examples property', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'userId',
          in: 'query',
          examples: {
            paramExample1: {
              value: '123',
            },
            paramExample2: {
              value: '456',
            },
          },
        },
      ],
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual(['paramExample1', 'paramExample2'])
  })

  it('extracts examples from parameter content', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'filter',
          in: 'query',
          content: {
            'application/json': {
              examples: {
                contentExample: {
                  value: { active: true },
                },
              },
            },
          },
        },
      ],
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual(['contentExample'])
  })

  it('extracts examples from multiple parameters', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'userId',
          in: 'query',
          examples: {
            example1: {
              value: '123',
            },
          },
        },
        {
          name: 'filter',
          in: 'query',
          content: {
            'application/json': {
              examples: {
                example2: {
                  value: { active: true },
                },
              },
            },
          },
        },
      ],
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toHaveLength(2)
    expect(result).toContain('example1')
    expect(result).toContain('example2')
  })

  it('handles parameter with $ref', () => {
    const operation: OperationObject = {
      parameters: [
        {
          $ref: '#/components/parameters/UserIdParam',
          '$ref-value': {
            name: 'userId',
            in: 'query',
            examples: {
              refParamExample: {
                value: '123',
              },
            },
          },
        },
      ],
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual(['refParamExample'])
  })

  it('handles parameter without examples or content', () => {
    const operation: OperationObject = {
      parameters: [
        {
          name: 'userId',
          in: 'query',
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual([])
  })

  it('extracts examples from responses', () => {
    const operation: OperationObject = {
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              examples: {
                responseExample1: {
                  value: { success: true },
                },
                responseExample2: {
                  value: { success: false },
                },
              },
            },
          },
        },
      },
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual(['responseExample1', 'responseExample2'])
  })

  it('extracts examples from multiple response codes', () => {
    const operation: OperationObject = {
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              examples: {
                successExample: {
                  value: { success: true },
                },
              },
            },
          },
        },
        '404': {
          description: 'Not Found',
          content: {
            'application/json': {
              examples: {
                notFoundExample: {
                  value: { error: 'Not found' },
                },
              },
            },
          },
        },
      },
    }

    const result = traverseOperationExamples(operation)

    expect(result).toHaveLength(2)
    expect(result).toContain('successExample')
    expect(result).toContain('notFoundExample')
  })

  it('handles response with $ref', () => {
    const operation: OperationObject = {
      responses: {
        '200': {
          $ref: '#/components/responses/SuccessResponse',
          '$ref-value': {
            description: 'Success',
            content: {
              'application/json': {
                examples: {
                  refResponseExample: {
                    value: { success: true },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual(['refResponseExample'])
  })

  it('handles response without content', () => {
    const operation: OperationObject = {
      responses: {
        '204': {
          description: 'No Content',
        },
      },
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual([])
  })

  it('handles response with content but no examples', () => {
    const operation: OperationObject = {
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
      },
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual([])
  })

  it('deduplicates example names across different sources', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            examples: {
              sharedExample: {
                value: { id: 1 },
              },
            },
          },
        },
      },
      parameters: [
        {
          name: 'userId',
          in: 'query',
          examples: {
            sharedExample: {
              value: '123',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              examples: {
                sharedExample: {
                  value: { success: true },
                },
              },
            },
          },
        },
      },
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual(['sharedExample'])
  })

  it('extracts all examples from complex operation', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            examples: {
              requestExample: {
                value: { id: 1 },
              },
            },
          },
        },
      },
      parameters: [
        {
          name: 'userId',
          in: 'query',
          examples: {
            paramExample: {
              value: '123',
            },
          },
        },
        {
          name: 'filter',
          in: 'query',
          content: {
            'application/json': {
              examples: {
                paramContentExample: {
                  value: { active: true },
                },
              },
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              examples: {
                successExample: {
                  value: { success: true },
                },
              },
            },
          },
        },
        '404': {
          description: 'Not Found',
          content: {
            'application/json': {
              examples: {
                errorExample: {
                  value: { error: 'Not found' },
                },
              },
            },
          },
        },
      },
    }

    const result = traverseOperationExamples(operation)

    expect(result).toHaveLength(5)
    expect(result).toContain('requestExample')
    expect(result).toContain('paramExample')
    expect(result).toContain('paramContentExample')
    expect(result).toContain('successExample')
    expect(result).toContain('errorExample')
  })

  it('handles operation with no requestBody, parameters, or responses', () => {
    const operation: OperationObject = {}

    const result = traverseOperationExamples(operation)

    expect(result).toEqual([])
  })

  it('handles empty arrays and objects gracefully', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {},
      },
      parameters: [],
      responses: {},
    }

    const result = traverseOperationExamples(operation)

    expect(result).toEqual([])
  })

  it('handles mixed $ref and regular objects', () => {
    const operation: OperationObject = {
      requestBody: {
        $ref: '#/components/requestBodies/RequestBody',
        '$ref-value': {
          content: {
            'application/json': {
              examples: {
                refExample: {
                  value: { id: 1 },
                },
              },
            },
          },
        },
      },
      parameters: [
        {
          name: 'userId',
          in: 'query',
          examples: {
            regularExample: {
              value: '123',
            },
          },
        },
      ],
      responses: {
        '200': {
          $ref: '#/components/responses/SuccessResponse',
          '$ref-value': {
            description: 'Success',
            content: {
              'application/json': {
                examples: {
                  anotherRefExample: {
                    value: { success: true },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = traverseOperationExamples(operation)

    expect(result).toHaveLength(3)
    expect(result).toContain('refExample')
    expect(result).toContain('regularExample')
    expect(result).toContain('anotherRefExample')
  })

  it('preserves insertion order of unique examples', () => {
    const operation: OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            examples: {
              first: { value: 1 },
              second: { value: 2 },
            },
          },
        },
      },
      parameters: [
        {
          name: 'param',
          in: 'query',
          examples: {
            third: { value: 3 },
          },
        },
      ],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              examples: {
                fourth: { value: 4 },
              },
            },
          },
        },
      },
    }

    const result = traverseOperationExamples(operation)

    // Since we are using a Set and then converting to array,
    // the order should be preserved based on insertion order
    expect(result[0]).toBe('first')
    expect(result[1]).toBe('second')
    expect(result[2]).toBe('third')
    expect(result[3]).toBe('fourth')
  })
})
