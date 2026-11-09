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
})
