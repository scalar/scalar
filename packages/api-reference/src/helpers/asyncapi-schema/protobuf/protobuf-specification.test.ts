// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readProtobuf } from './protobuf'

// https://protobuf.dev/reference/protobuf/proto2-spec/
// https://protobuf.dev/reference/protobuf/proto3-spec/
// Semantic restrictions also come from the official proto2/proto3 language guides.
// Syntax parsing alone in protobufjs does not enforce all of these restrictions.
describe('protobuf-specification', () => {
  it.each([
    'double',
    'float',
    'int32',
    'int64',
    'uint32',
    'uint64',
    'sint32',
    'sint64',
    'fixed32',
    'fixed64',
    'sfixed32',
    'sfixed64',
    'bool',
    'string',
    'bytes',
  ])('preserves native scalar %s in proto2 and proto3', (type) => {
    for (const version of ['2', '3']) {
      const rule = version === '2' ? 'optional ' : ''
      expect(
        readProtobuf(`syntax = "proto${version}"; message M { ${rule}${type} native_name = 1; }`, version).nodes[0]
          ?.children,
      ).toStrictEqual([
        {
          name: 'native_name',
          type,
          fieldNumber: 1,
          details: [version === '2' ? 'Optional' : 'Optional (implicit presence)'],
        },
      ])
    }
  })

  it.each([
    'int32',
    'int64',
    'uint32',
    'uint64',
    'sint32',
    'sint64',
    'fixed32',
    'fixed64',
    'sfixed32',
    'sfixed64',
    'bool',
    'string',
  ])('accepts map key type %s', (key) => {
    for (const version of ['2', '3']) {
      expect(
        readProtobuf(`syntax = "proto${version}"; message M { map<${key}, string> values = 1; }`, version).nodes[0]
          ?.children?.[0]?.type,
      ).toBe(`map<${key}, string>`)
    }
  })

  it('resolves forward, nested, qualified, absolute and mutually recursive message names', () => {
    const result = readProtobuf(
      `syntax = "proto3"; package sample;
      message A { B b = 1; message Inner { string id = 1; } }
      message B { .sample.A a = 1; A.Inner inner = 2; }`,
      '3',
    )
    expect(result.nodes.map(({ type }) => type)).toStrictEqual([
      'message sample.A',
      'message sample.A.Inner',
      'message sample.B',
    ])
    expect(result.nodes[0]?.children?.[0]?.children?.[0]?.details).toStrictEqual([
      'Optional (explicit presence)',
      'Recursive reference',
    ])
    expect(result.nodes[2]?.children?.[1]?.children?.[0]?.name).toBe('id')
  })

  it('preserves explicit presence, oneof membership and repeated rules', () => {
    expect(
      readProtobuf(
        `syntax = "proto3"; message M {
      optional string id = 1;
      repeated int32 values = 2 [packed = false];
      oneof contact { string email = 3; bytes phone = 4; }
    }`,
        '3',
      ).nodes[0]?.children,
    ).toStrictEqual([
      { name: 'id', type: 'string', fieldNumber: 1, details: ['Optional (explicit presence)'] },
      { name: 'values', type: 'int32', fieldNumber: 2, details: ['Repeated', 'packed: false'] },
      { name: 'email', type: 'string', oneofGroup: 'contact', fieldNumber: 3, details: [] },
      { name: 'phone', type: 'bytes', oneofGroup: 'contact', fieldNumber: 4, details: [] },
    ])
  })

  it('preserves enum aliases, negative values and declaration order', () => {
    expect(
      readProtobuf(
        'syntax = "proto3"; enum E { option allow_alias = true; ZERO = 0; NONE = 0; NEG = -1; }',
        '3',
      ).nodes[0]?.children?.map(({ name, type }) => ({ name, type })),
    ).toStrictEqual([
      { name: 'ZERO', type: '0' },
      { name: 'NONE', type: '0' },
      { name: 'NEG', type: '-1' },
    ])
    expect(
      readProtobuf('syntax = "proto2"; enum E { FIRST = 5; SECOND = 0; }', '2').nodes[0]?.children?.[0]?.type,
    ).toBe('5')
  })

  it('preserves comments and standard field options', () => {
    const result = readProtobuf(
      `syntax = "proto3";
      // A user
      message User {
        // Stable ID
        string user_id = 1 [deprecated = true, json_name = "userId"];
      }`,
      '3',
    )
    expect(result.nodes[0]?.description?.trim()).toBe('A user')
    expect(result.nodes[0]?.children?.[0]?.description?.trim()).toBe('Stable ID')
    expect(result.nodes[0]?.children?.[0]?.details).toStrictEqual([
      'Optional (implicit presence)',
      'deprecated: true',
      'json_name: "userId"',
    ])
  })

  it.each([1, 18999, 20000, 536870911])('accepts legal field-number boundary %i', (id) => {
    expect(
      readProtobuf(`syntax = "proto3"; message M { int32 x = ${id}; }`, '3').nodes[0]?.children?.[0]?.fieldNumber,
    ).toBe(id)
  })

  it.each([0, -1, 19000, 19999, 536870912])('rejects illegal field-number boundary %i', (id) => {
    expect(() => readProtobuf(`syntax = "proto3"; message M { int32 x = ${id}; }`, '3')).toThrow()
  })

  it.each([
    'message M { string a = 1; int32 b = 1; }',
    'message M { string a = 1; int32 a = 2; }',
    'message M { reserved 2; string a = 2; }',
    'message M { string a = 2; reserved 2; }',
    'message M { string a = 2; reserved "a"; }',
    'message M { reserved 2 to 4; string a = 4; }',
    'message M { required string a = 1; }',
    'message M { string a = 1 [default = "x"]; }',
    'message M { repeated string a = 1 [packed = true]; }',
    'message M { int32 a = 1 [packed = true]; }',
    'message M { string a = 1 [deprecated = "yes"]; }',
    'message M { string a = 1 [json_name = 12]; }',
    'message M { Missing a = 1; }',
    'message M { oneof x { repeated string a = 1; } }',
    'message M { map<float, string> a = 1; }',
    'message M { map<bytes, string> a = 1; }',
    'enum E { ZERO = 0; } message M { map<E, string> a = 1; }',
    'enum E { ONE = 1; }',
    'enum E {}',
    'enum E { ZERO = 0; TOO_BIG = 2147483648; }',
    'enum E { ZERO = 0; TOO_SMALL = -2147483649; }',
    'enum E { ZERO = 0; ALSO_ZERO = 0; }',
    'enum E { ZERO = 0; reserved 1; ONE = 1; }',
    'enum E { ZERO = 0; ONE = 1; reserved 1; }',
    'enum E { ZERO = 0; reserved "ZERO"; }',
    'enum A { ZERO = 0; } enum B { ZERO = 0; }',
    'message M { string x = 1; enum E { x = 0; } }',
  ])('rejects malformed proto3 definitions: %s', (body) => {
    expect(() => readProtobuf(`syntax = "proto3"; ${body}`, '3')).toThrow()
  })

  it.each([
    ['int32', '12', '12'],
    ['uint32', '4294967295', '4294967295'],
    ['bool', 'true', 'true'],
    ['string', '"hello"', '"hello"'],
    ['double', '1.25', '1.25'],
    ['float', 'inf', 'Infinity'],
    ['double', 'nan', 'NaN'],
  ])('preserves proto2 scalar defaults: %s %s', (type, literal, expected) => {
    expect(
      readProtobuf(
        `syntax = "proto2"; message M { optional ${type} x = 1 [default = ${literal}]; }`,
        '2',
      ).nodes[0]?.children?.[0]?.details?.at(-1),
    ).toBe(`Default: ${expected}`)
  })

  it.each([
    'message M { optional int32 x = 1 [default = "wrong"]; }',
    'message M { optional int32 x = 1 [default = 2147483648]; }',
    'message M { optional uint32 x = 1 [default = -1]; }',
    'message M { optional bool x = 1 [default = 1]; }',
    'message M { repeated int32 x = 1 [default = 1]; }',
    'message M { optional M x = 1 [default = 1]; }',
    'message M { oneof x { int32 y = 1 [default = 1]; } }',
    'enum E { ZERO = 0; } message M { optional E e = 1 [default = MISSING]; }',
    'message M { string x = 1; }',
  ])('rejects malformed proto2 defaults or field rules: %s', (body) => {
    expect(() => readProtobuf(`syntax = "proto2"; ${body}`, '2')).toThrow()
  })

  it.each([
    'import "other.proto"; message M {}',
    'import public "other.proto"; message M {}',
    'import weak "other.proto"; message M {}',
    'message M {} service API { rpc Call(M) returns(M); }',
    'message M { option (custom) = true; }',
    'option (custom) = true; message M {}',
    'message M { oneof value { option (custom) = true; string s = 1; } }',
    'enum E { ZERO = 0 [(custom) = true]; }',
  ])('uses source for unsupported proto3 constructs: %s', (body) => {
    expect(() => readProtobuf(`syntax = "proto3"; ${body}`, '3')).toThrow()
  })

  it.each([
    'message M { optional group G = 1 { optional string x = 2; } }',
    'message M { extensions 100 to 199; }',
    'message M { extensions 100 to 199; } extend M { optional string x = 100; }',
  ])('uses source for proto2 groups and extensions: %s', (body) => {
    expect(() => readProtobuf(`syntax = "proto2"; ${body}`, '2')).toThrow()
  })

  it('checks syntax against schemaFormat and rejects editions', () => {
    expect(() => readProtobuf('syntax = "proto2"; message M {}', '3')).toThrow()
    expect(() => readProtobuf('edition = "2023"; message M {}', '3')).toThrow()
    // Inline schemaFormat explicitly supplies the version; this differs from an unversioned .proto file.
    expect(readProtobuf('message M { string x = 1; }', '3').nodes[0]?.type).toBe('message M')
  })
  it('honors local name shadowing over an outer message', () => {
    const schema = readProtobuf(
      `syntax = "proto3";
      message Value { string outer = 1; }
      message M { message Value { bool inner = 1; } Value value = 1; }`,
      '3',
    )
    expect(schema.nodes[1]?.children?.[0]?.children?.[0]?.name).toBe('inner')
  })

  it('accepts valid reserved fields and hexadecimal field numbers', () => {
    expect(
      readProtobuf('syntax = "proto3"; message M { reserved 2 to 4; reserved "removed"; string value = 0x05; }', '3')
        .nodes[0]?.children?.[0]?.details,
    ).toStrictEqual(['Optional (implicit presence)'])
  })

  it('preserves proto2 enum defaults and concatenated escaped strings', () => {
    const schema = readProtobuf(
      `syntax = 'proto2';
      enum E { FIRST = 1; SECOND = 2; }
      message M { optional E e = 1 [default = SECOND]; optional string text = 2 [default = "a" "b"]; }`,
      '2',
    )
    expect(schema.nodes[1]?.children?.map((child) => child.details?.at(-1))).toStrictEqual([
      'Default: "SECOND"',
      'Default: "ab"',
    ])
  })

  it.each([
    'message M { reserved 5 to 2; }',
    'message M { reserved 0; }',
    'enum E { option allow_alias = "yes"; ZERO = 0; }',
    'message M { option map_entry = true; string key = 1; string value = 2; }',
    'message M { map<string, string> values = 1; message ValuesEntry {} }',
    'message M { oneof choice { string x = 1; } enum E { choice = 0; } }',
  ])('rejects invalid ranges, generated map-entry collisions and option shapes: %s', (body) => {
    expect(() => readProtobuf(`syntax = "proto3"; ${body}`, '3')).toThrow()
  })

  it('bounds very wide and deeply nested declarations', () => {
    expect(() =>
      readProtobuf(
        `syntax = "proto3"; message M { ${Array.from({ length: 2100 }, (_, i) => `string f${i} = ${i + 1};`).join(' ')} }`,
        '3',
      ),
    ).toThrow()
    expect(() => readProtobuf(`syntax = "proto3"; ${'message M {'.repeat(100)}${'}'.repeat(100)}`, '3')).toThrow()
  })

  it.each([
    'message A { message Inner {} } message B { Inner value = 1; }',
    'message A { message Inner {} } message B { message A {} A.Inner value = 1; }',
  ])('does not resolve through unrelated nested scopes or a shadowed prefix: %s', (body) => {
    expect(() => readProtobuf(`syntax = "proto3"; ${body}`, '3')).toThrow()
  })
  it('falls back when protobufjs loses the enum reserved max endpoint', () => {
    // protobufjs 7.5.4 parses max as the field limit, not the signed enum limit.
    expect(() =>
      readProtobuf('syntax = "proto3"; enum E { ZERO = 0; reserved 1 to max; HIGH = 600000000; }', '3'),
    ).toThrow()
  })

  it('rejects map fields whose generated entry names collide', () => {
    expect(() =>
      readProtobuf(
        'syntax = "proto3"; message M { map<string, string> foo_bar = 1; map<string, string> fooBar = 2; }',
        '3',
      ),
    ).toThrow()
  })
})
