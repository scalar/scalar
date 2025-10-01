import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'
import type { TraversedEntrySchema } from '@/schemas/v3.1/strict/openapi-document'

import {
  TraversedDescriptionSchemaDefinition,
  type TraversedEntry,
  TraversedEntrySchemaDefinition,
  TraversedOperationSchemaDefinition,
  TraversedSchemaSchemaDefinition,
  TraversedTagSchemaDefinition,
  TraversedWebhookSchemaDefinition,
} from './navigation'

describe('navigation', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof TraversedEntrySchema>>
      type TypescriptType = RequiredDeep<TraversedEntry>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    describe('TraversedDescriptionSchemaDefinition', () => {
      it('parses valid description entry correctly', () => {
        const validInput = {
          id: 'desc-1',
          title: 'Description Title',
          type: 'text',
          children: [],
        }

        const result = coerceValue(TraversedDescriptionSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedDescriptionSchemaDefinition, result)).toBe(true)
      })

      it('parses description entry without optional children', () => {
        const validInput = {
          id: 'desc-2',
          title: 'Simple Description',
          type: 'text',
        }

        const result = coerceValue(TraversedDescriptionSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedDescriptionSchemaDefinition, result)).toBe(true)
      })

      it('rejects invalid description entry', () => {
        const invalidInput = {
          id: 'desc-3',
          title: 'Description Title',
          type: 'invalid-type', // wrong type
        }

        expect(Value.Check(TraversedDescriptionSchemaDefinition, invalidInput)).toBe(false)
      })
    })

    describe('TraversedOperationSchemaDefinition', () => {
      it('parses valid operation entry correctly', () => {
        const validInput = {
          id: 'op-1',
          title: 'Get User',
          type: 'operation',
          ref: '#/paths/~1users~1{id}/get',
          method: 'get',
          path: '/users/{id}',
          isDeprecated: false,
        }

        const result = coerceValue(TraversedOperationSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedOperationSchemaDefinition, result)).toBe(true)
      })

      it('parses operation entry without optional isDeprecated', () => {
        const validInput = {
          id: 'op-2',
          title: 'Create User',
          type: 'operation',
          ref: '#/paths/~1users/post',
          method: 'post',
          path: '/users',
        }

        const result = coerceValue(TraversedOperationSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedOperationSchemaDefinition, result)).toBe(true)
      })

      it('rejects operation entry with invalid HTTP method', () => {
        const invalidInput = {
          id: 'op-3',
          title: 'Invalid Operation',
          type: 'operation',
          ref: '#/paths/~1users/get',
          method: 'invalid-method', // not a valid HTTP method
          path: '/users',
        }

        expect(Value.Check(TraversedOperationSchemaDefinition, invalidInput)).toBe(false)
      })
    })

    describe('TraversedSchemaSchemaDefinition', () => {
      it('parses valid schema entry correctly', () => {
        const validInput = {
          id: 'schema-1',
          title: 'User Model',
          type: 'model',
          ref: '#/components/schemas/User',
          name: 'User',
        }

        const result = coerceValue(TraversedSchemaSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedSchemaSchemaDefinition, result)).toBe(true)
      })

      it('rejects schema entry with wrong type', () => {
        const invalidInput = {
          id: 'schema-2',
          title: 'User Model',
          type: 'invalid-type', // wrong type
          ref: '#/components/schemas/User',
          name: 'User',
        }

        expect(Value.Check(TraversedSchemaSchemaDefinition, invalidInput)).toBe(false)
      })
    })

    describe('TraversedWebhookSchemaDefinition', () => {
      it('parses valid webhook entry correctly', () => {
        const validInput = {
          id: 'webhook-1',
          title: 'User Created Webhook',
          type: 'webhook',
          ref: '#/components/webhooks/userCreated',
          method: 'post',
          name: 'userCreated',
          isDeprecated: true,
        }

        const result = coerceValue(TraversedWebhookSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedWebhookSchemaDefinition, result)).toBe(true)
      })

      it('parses webhook entry without optional fields', () => {
        const validInput = {
          id: 'webhook-2',
          title: 'User Updated Webhook',
          type: 'webhook',
          ref: '#/components/webhooks/userUpdated',
          method: 'put',
          name: 'userUpdated',
        }

        const result = coerceValue(TraversedWebhookSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedWebhookSchemaDefinition, result)).toBe(true)
      })
    })

    describe('TraversedTagSchemaDefinition', () => {
      it('parses valid tag entry correctly', () => {
        const validInput = {
          id: 'tag-1',
          title: 'User Operations',
          type: 'tag',
          name: 'users',
          description: 'Operations related to users',
          children: [],
          isGroup: true,
          isWebhooks: false,
          xKeys: {
            'x-custom-key': 'custom-value',
          },
        }

        const result = coerceValue(TraversedTagSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedTagSchemaDefinition, result)).toBe(true)
      })

      it('parses minimal tag entry', () => {
        const validInput = {
          id: 'tag-2',
          title: 'Minimal Tag',
          type: 'tag',
          name: 'minimal',
          isGroup: false,
        }

        const result = coerceValue(TraversedTagSchemaDefinition, validInput)
        expect(result).toEqual(validInput)
        expect(Value.Check(TraversedTagSchemaDefinition, result)).toBe(true)
      })
    })

    describe('TraversedEntrySchemaDefinition (union)', () => {
      it('accepts all valid entry types', () => {
        const validEntries = [
          {
            id: 'desc-1',
            title: 'Description',
            type: 'text' as const,
          },
          {
            id: 'op-1',
            title: 'Operation',
            type: 'operation' as const,
            ref: '#/paths/test',
            method: 'get' as const,
            path: '/test',
          },
          {
            id: 'schema-1',
            title: 'Schema',
            type: 'model' as const,
            ref: '#/components/schemas/Test',
            name: 'Test',
          },
          {
            id: 'webhook-1',
            title: 'Webhook',
            type: 'webhook' as const,
            ref: '#/components/webhooks/test',
            method: 'post' as const,
            name: 'test',
          },
          {
            id: 'tag-1',
            title: 'Tag',
            type: 'tag' as const,
            name: 'test',
            isGroup: true,
          },
        ]

        validEntries.forEach((entry) => {
          expect(Value.Check(TraversedEntrySchemaDefinition, entry)).toBe(true)
        })
      })

      it('rejects invalid entry types', () => {
        const invalidEntry = {
          id: 'invalid-1',
          title: 'Invalid Entry',
          type: 'invalid-type', // not a valid type
        }

        expect(Value.Check(TraversedEntrySchemaDefinition, invalidEntry)).toBe(false)
      })

      it('rejects non-object input', () => {
        expect(Value.Check(TraversedEntrySchemaDefinition, 'string')).toBe(false)
        expect(Value.Check(TraversedEntrySchemaDefinition, 123)).toBe(false)
        expect(Value.Check(TraversedEntrySchemaDefinition, null)).toBe(false)
        expect(Value.Check(TraversedEntrySchemaDefinition, undefined)).toBe(false)
      })
    })
  })
})
