// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readSchema } from '../read-schema'

const proto = 'application/vnd.google.protobuf;version=3'

describe('protobuf', () => {
  it('preserves Protobuf names, numbers, repeated fields, oneofs and recursion', () => {
    const result = readSchema(
      proto,
      'syntax = "proto3"; message User { string user_id = 1; repeated int64 ids = 2; oneof contact { string email = 3; string phone = 4; } User parent = 5; }',
    )
    expect(result?.nodes[0]?.children).toStrictEqual([
      { name: 'user_id', type: 'string', fieldNumber: 1, presence: 'implicit' },
      { name: 'ids', type: 'int64', fieldNumber: 2, repeated: true },
      { name: 'email', type: 'string', oneofGroup: 'contact', fieldNumber: 3 },
      { name: 'phone', type: 'string', oneofGroup: 'contact', fieldNumber: 4 },
      {
        name: 'parent',
        type: 'message User',
        fieldNumber: 5,
        presence: 'explicit',
        recursive: true,
      },
    ])
  })

  it('keeps proto2 required fields and defaults distinct from proto3 presence', () => {
    expect(
      readSchema(
        'application/vnd.google.protobuf;version=2',
        'syntax = "proto2"; message User { required string id = 1; optional int32 age = 2 [default = 10]; }',
      )?.nodes[0]?.children,
    ).toStrictEqual([
      { name: 'id', type: 'string', fieldNumber: 1, required: true },
      { name: 'age', type: 'int32', fieldNumber: 2, required: false, details: ['Default: 10'] },
    ])
    expect(
      readSchema(proto, 'syntax = "proto3"; message User { optional string id = 1; }')?.nodes[0]?.children,
    ).toStrictEqual([{ name: 'id', type: 'string', fieldNumber: 1, presence: 'explicit' }])
  })

  it('shows all Protobuf definitions and map key types', () => {
    const result = readSchema(
      proto,
      'syntax = "proto3"; package test; message User { map<string, int32> counts = 1; } enum State { OFF = 0; ON = 1; }',
    )
    expect(result?.nodes.map(({ name, type }) => ({ name, type }))).toStrictEqual([
      { name: 'User', type: 'message test.User' },
      { name: 'State', type: 'enum test.State' },
    ])
    expect(result?.nodes[0]?.children).toStrictEqual([
      {
        name: 'counts',
        type: 'map<string, int32>',
        mapKey: 'string',
        mapValue: { name: 'Values', type: 'int32' },
        fieldNumber: 1,
      },
    ])
    expect(result?.nodes[1]?.children).toStrictEqual([
      { name: 'OFF', type: '0' },
      { name: 'ON', type: '1' },
    ])
  })

  it('distinguishes explicit presence across nested scopes without reading comments or strings as declarations', () => {
    const result = readSchema(
      proto,
      `syntax = "proto3";
      message Outer {
        // optional string implicit_id = 1;
        string implicit_id = 1;
        optional string explicit_id = 2 [json_name = "optional string implicit_id = 1;"];
        message Inner {
          string explicit_id = 1;
          optional string implicit_id = 2;
        }
      }`,
    )
    expect(result?.nodes.map((node) => node.children?.map(({ name, presence }) => ({ name, presence })))).toStrictEqual(
      [
        [
          { name: 'implicit_id', presence: 'implicit' },
          { name: 'explicit_id', presence: 'explicit' },
        ],
        [
          { name: 'explicit_id', presence: 'implicit' },
          { name: 'implicit_id', presence: 'explicit' },
        ],
      ],
    )
  })

  it('preserves enum value comments and deprecation metadata', () => {
    const result = readSchema(
      proto,
      `syntax = "proto3";
      enum State {
        // Ready to process
        READY = 0 [deprecated = true];
        // Work has finished
        DONE = 1;
      }`,
    )
    expect(result?.nodes[0]?.children).toStrictEqual([
      { name: 'READY', type: '0', description: 'Ready to process', details: ['deprecated: true'] },
      { name: 'DONE', type: '1', description: 'Work has finished' },
    ])
  })

  it.each([
    'message M { string first = 1; } message M { bool last = 2; }',
    'package sample; message M {} message M {}',
    'enum E { ZERO = 0; } enum E { ONE = 0; }',
    'message M {} enum M { ZERO = 0; }',
    'service API {} message API { string id = 1; }',
    'message API { string id = 1; } service API {}',
    'package sample; service API {} message API {}',
  ])('falls back to source for duplicate declarations: %s', (source) => {
    expect(readSchema(proto, `syntax = "proto3"; ${source}`)).toBeUndefined()
  })

  it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
    'preserves %s as a field, enum symbol, and type name',
    (name) => {
      const result = readSchema(
        proto,
        `syntax = "proto3";
        message ${name} { string ${name} = 1; }
        message M { ${name} value = 1; }
        enum E { ${name}_ZERO = 0; }
      `,
      )
      expect(result?.nodes).toStrictEqual([
        { name, type: `message ${name}`, children: [{ name, type: 'string', fieldNumber: 1, presence: 'implicit' }] },
        {
          name: 'M',
          type: 'message M',
          children: [
            {
              name: 'value',
              type: `message ${name}`,
              fieldNumber: 1,
              presence: 'explicit',
              children: [{ name, type: 'string', fieldNumber: 1, presence: 'implicit' }],
            },
          ],
        },
        { name: 'E', type: 'enum E', children: [{ name: `${name}_ZERO`, type: '0' }] },
      ])
      expect(readSchema(proto, `syntax = "proto3"; enum E { ${name} = 0; }`)?.nodes[0]?.children).toStrictEqual([
        { name, type: '0' },
      ])
    },
  )

  it('resolves prototype names through package and oneof dictionaries', () => {
    const result = readSchema(
      proto,
      `syntax = "proto3";
      package constructor.__proto__;
      message toString { string id = 1; }
      message M { oneof hasOwnProperty { toString constructor = 1; } }
    `,
    )
    expect(result?.nodes[1]?.children).toStrictEqual([
      {
        name: 'constructor',
        type: 'message constructor.__proto__.toString',
        fieldNumber: 1,
        oneofGroup: 'hasOwnProperty',
        children: [{ name: 'id', type: 'string', fieldNumber: 1, presence: 'implicit' }],
      },
    ])
  })

  it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__'])(
    'does not mistake inherited %s properties for valid map key types or enum options',
    (name) => {
      expect(readSchema(proto, `syntax = "proto3"; message M { map<${name}, string> values = 1; }`)).toBeUndefined()
      expect(readSchema(proto, `syntax = "proto3"; enum E { ZERO = 0 [${name} = true]; }`)).toBeUndefined()
    },
  )
})
