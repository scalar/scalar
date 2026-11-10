// @vitest-environment node

import { protobufFieldNumber, protobufPresence, schemaRecursiveTarget } from '@scalar/blocks/schema'
import { describe, expect, it } from 'vitest'

import { toDisplaySchema } from '../to-display-schema'
import { readProtobuf } from './protobuf'

// Exercise parser -> renderer input. Parser success alone must not lose enum or map semantics.
describe('protobuf-display', () => {
  it('keeps enum numbers and aliases with the shared renderer enum annotations', () => {
    const node = readProtobuf(
      'syntax = "proto3"; enum E { option allow_alias = true; ZERO = 0; NONE = 0; NEG = -1; }',
      '3',
    ).nodes[0]!
    expect(toDisplaySchema(node)).toStrictEqual({
      type: 'integer',
      format: 'enum E',
      enum: [0, -1],
      'x-enum-varnames': ['ZERO / NONE', 'NEG'],
    })
  })

  it('keeps enum-valued maps as dictionaries of enums', () => {
    const node = readProtobuf(
      'syntax = "proto3"; enum E { ZERO = 0; ONE = 1; } message M { map<string, E> statuses = 1; }',
      '3',
    ).nodes[1]?.children?.[0]!
    expect(toDisplaySchema(node)).toStrictEqual({
      type: 'object',
      [protobufFieldNumber]: 1,
      description: 'Map keys: string',
      additionalProperties: { type: 'integer', format: 'enum E', enum: [0, 1], 'x-enum-varnames': ['ZERO', 'ONE'] },
    })
  })

  it('keeps message-valued and recursive maps distinct from scalar values', () => {
    const node = readProtobuf('syntax = "proto3"; message M { map<bool, M> children = 1; }', '3').nodes[0]
      ?.children?.[0]!
    expect(toDisplaySchema(node)).toStrictEqual({
      type: 'object',
      [protobufFieldNumber]: 1,
      description: 'Map keys: bool',
      additionalProperties: { type: 'object', title: 'message M', [schemaRecursiveTarget]: 'M' },
    })
    const empty = readProtobuf('syntax = "proto3"; message Empty {} message M { map<string, Empty> values = 1; }', '3')
      .nodes[1]?.children?.[0]!
    expect(toDisplaySchema(empty)).toStrictEqual({
      type: 'object',
      [protobufFieldNumber]: 1,
      description: 'Map keys: string',
      additionalProperties: { type: 'object', properties: {} },
    })
  })

  it('preserves enum descriptions and deprecation through repeated fields', () => {
    const node = readProtobuf(
      `syntax = "proto3";
      enum E {
        // Nothing selected
        ZERO = 0 [deprecated = true];
        ONE = 1;
      }
      message M { repeated E states = 1; }`,
      '3',
    ).nodes[1]?.children?.[0]!
    expect(toDisplaySchema(node)).toStrictEqual({
      type: 'array',
      [protobufFieldNumber]: 1,
      items: {
        type: 'integer',
        format: 'enum E',
        enum: [0, 1],
        'x-enum-varnames': ['ZERO', 'ONE'],
        'x-enum-descriptions': ['ZERO: Nothing selected\n\ndeprecated: true', ''],
      },
    })
  })
  it('renders a oneof as sibling-field alternatives, including an unset choice', () => {
    const node = readProtobuf(
      'syntax = "proto3"; message M { string id = 1; oneof contact { string email = 2; string phone = 3; } }',
      '3',
    ).nodes[0]!
    expect(toDisplaySchema(node)).toStrictEqual({
      allOf: [
        {
          type: 'object',
          properties: { id: { type: 'string', [protobufFieldNumber]: 1, [protobufPresence]: 'implicit' } },
        },
        {
          oneOf: [
            {
              type: 'object',
              title: 'contact: email',
              properties: { email: { type: 'string', [protobufFieldNumber]: 2 } },
              required: ['email'],
            },
            {
              type: 'object',
              title: 'contact: phone',
              properties: { phone: { type: 'string', [protobufFieldNumber]: 3 } },
              required: ['phone'],
            },
            {
              type: 'object',
              title: 'contact: Not set',
              description: 'No field in the contact group is set.',
            },
          ],
        },
      ],
    })
  })

  it('keeps multiple oneof groups independent and ordinary proto2 required fields outside them', () => {
    const node = readProtobuf(
      'syntax = "proto2"; message M { required string id = 1; oneof contact { string email = 2; string phone = 3; } oneof location { string city = 4; int32 zip = 5; } }',
      '2',
    ).nodes[0]!
    const display = toDisplaySchema(node)
    expect(display).toHaveProperty('allOf.length', 3)
    expect(display).toHaveProperty('allOf.0.required', ['id'])
    expect(display).toHaveProperty('allOf.1.oneOf.0.title', 'contact: email')
    expect(display).toHaveProperty('allOf.1.oneOf.length', 3)
    expect(display).toHaveProperty('allOf.2.oneOf.0.title', 'location: city')
    expect(display).toHaveProperty('allOf.2.oneOf.length', 3)
  })

  it('does not turn proto3 optional fields into oneof pickers', () => {
    const node = readProtobuf('syntax = "proto3"; message M { optional string id = 1; }', '3').nodes[0]!
    expect(node.children?.[0]?.oneofGroup).toBeUndefined()
    expect(toDisplaySchema(node)).toStrictEqual({
      type: 'object',
      properties: {
        id: { type: 'string', [protobufFieldNumber]: 1, [protobufPresence]: 'explicit' },
      },
    })
  })

  it('preserves message alternatives and a single-member optional group', () => {
    const node = readProtobuf('syntax = "proto3"; message M { oneof choice { M nested = 1; } }', '3').nodes[0]!
    const display = toDisplaySchema(node)
    expect(display).toHaveProperty('allOf.0.oneOf.length', 2)
    expect(display).toHaveProperty('allOf.0.oneOf.0.properties.nested', {
      type: 'object',
      title: 'message M',
      [protobufFieldNumber]: 1,
      [schemaRecursiveTarget]: 'M',
    })
    expect(display).toHaveProperty('allOf.0.oneOf.1.title', 'choice: Not set')
  })
})
