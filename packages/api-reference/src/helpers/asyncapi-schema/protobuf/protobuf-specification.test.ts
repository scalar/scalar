// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readProtobuf } from './protobuf'

// https://protobuf.dev/reference/protobuf/proto2-spec/
// https://protobuf.dev/reference/protobuf/proto3-spec/
// Semantic restrictions also come from the official proto2/proto3 language guides.
// Scalar validates semantic restrictions after parsing.
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
          ...(version === '2' ? { required: false } : { presence: 'implicit' }),
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
    expect(result.nodes[0]?.children?.[0]?.children?.[0]?.presence).toBe('explicit')
    expect(result.nodes[0]?.children?.[0]?.children?.[0]?.recursive).toBe(true)
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
      { name: 'id', type: 'string', fieldNumber: 1, presence: 'explicit' },
      { name: 'values', type: 'int32', fieldNumber: 2, repeated: true, details: ['packed: false'] },
      { name: 'email', type: 'string', oneofGroup: 'contact', fieldNumber: 3 },
      { name: 'phone', type: 'bytes', oneofGroup: 'contact', fieldNumber: 4 },
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
    expect(result.nodes[0]?.children?.[0]?.details).toStrictEqual(['deprecated: true', 'json_name: "userId"'])
  })

  it('preserves adjacent block comments and ignores detached block comments', () => {
    const [node] = readProtobuf(
      `/** The message.
       * Second line.
       */
      message M {
        /* The first field.
           Second line. */
        string a = 1;
        /* A detached comment. */

        string b = 2;
      }`,
      '3',
    ).nodes
    expect(node?.description).toBe('The message.\nSecond line.')
    expect(node?.children?.map(({ description }) => description)).toStrictEqual([
      'The first field.\nSecond line.',
      undefined,
    ])
  })

  it.each([
    ['// Date saved.\u2028Always in UTC.', 'Date saved.\u2028Always in UTC.'],
    ['/* Date saved.\u2029Always in UTC. */', 'Date saved.\u2029Always in UTC.'],
  ])('preserves Unicode separators in Protobuf comments', (comment, description) => {
    const source = `${comment}\nmessage M {}`
    expect(readProtobuf(source, '3').nodes[0]?.description).toBe(description)
  })

  it.each([
    '{ flags { enabled: true }, second: false, }',
    String.raw`{ number: 0x10, symbol: "\u002a", extra: -inf }`,
    'true.foo',
    'inf.foo',
  ])('renders a schema with file metadata %s', (value) => {
    const source = `option example = ${value}; message M {}`
    expect(readProtobuf(source, '3').nodes).toStrictEqual([{ name: 'M', type: 'message M', children: [] }])
  })

  it.each([
    '{ enabled: true,, }',
    '{ enabled true }',
    '{ outer { enabled: true,, } }',
    '{ a:1b:2 }',
    '{ a:0x10b:2 }',
    '{ a:1.2b:2 }',
    '{ a: -Thing }',
  ])('rejects malformed aggregate metadata %s', (value) => {
    expect(() => readProtobuf(`option example = ${value}; message M {}`, '3')).toThrow()
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
        .nodes[0]?.children?.[0]?.presence,
    ).toBe('implicit')
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
  it('uses the signed enum maximum for reserved ranges', () => {
    expect(
      readProtobuf('syntax = "proto3"; enum E { ZERO = 0; reserved 600000000 to max; }', '3').nodes[0]?.children,
    ).toStrictEqual([{ name: 'ZERO', type: '0' }])
    expect(() =>
      readProtobuf('syntax = "proto3"; enum E { ZERO = 0; reserved 1 to max; HIGH = 600000000; }', '3'),
    ).toThrow()
  })

  it.each(['infinite', 'nanoseconds', 'true_value', 'false_value', 'INF'])(
    'preserves enum defaults whose names start with literal tokens: %s',
    (name) => {
      const source = `enum E { ${name} = 1; } message M { optional E value = 1 [default = ${name}]; }`
      expect(readProtobuf(source, '2').nodes[1]?.children?.[0]?.details).toStrictEqual([`Default: "${name}"`])
    },
  )

  it.each(['repeatedItem', 'mapValue'])('preserves type names that start with keywords: %s', (name) => {
    const source = `message ${name} {} message Inventory { ${name} value = 1; }`
    expect(readProtobuf(source, '3').nodes[1]?.children?.[0]?.type).toBe(`message ${name}`)
  })

  it.each(['map', 'repeated'])('resolves qualified type names that start with %s', (name) => {
    const source = `package ${name}; message V {} message M { ${name}.V value = 1; repeated .${name}.V values = 2; }`
    const fields = readProtobuf(source, '3').nodes[1]?.children
    expect(fields?.map(({ type, repeated }) => [type, repeated])).toStrictEqual([
      [`message ${name}.V`, undefined],
      [`message ${name}.V`, true],
    ])
  })

  it('rejects joined declarations', () => {
    expect(() => readProtobuf('messageItem {}', '3')).toThrow('Trailing Protobuf source')
  })

  it.each([
    'message M { string f = 1 [deprecated = true json_name = "g"]; }',
    'message M { string f = 1 [deprecated = true,]; }',
    'message M { string f = 1 [,deprecated = true]; }',
    'message M { string f = 1 []; }',
    'message M { reserved 2 3; string f = 1; }',
    'message M { reserved 2,,3; string f = 1; }',
    'message M { reserved 2to 4; string f = 1; }',
    'enum E { ZERO = 0; reserved -2to -1; }',
    'message M { reserved "foo" "bar"; string f = 1; }',
    'package foo.; message M {}',
    'package .foo; message M {}',
    'package .; message M {}',
    'option go_package. = "example"; message M {}',
    'option example = whatever.; message M {}',
    'option example = .unknown.; message M {}',
    `syntax = 'proto3"; message M {}`,
    'message M { string f = 1 [depre cated = true]; }',
    'message M { string f = 1 [deprecated) = true]; }',
    'enum E { ZERO = 0; ONE = +1; }',
  ])('rejects malformed lists or qualified names: %s', (source) => {
    expect(() => readProtobuf(source, '3')).toThrow()
  })

  it('preserves inline comments that describe the next field', () => {
    const [node] = readProtobuf(
      `message M {
        string a = 1; /* The second field.
          * Second line. */
        string b = 2;
        // The third field.
        string c = 3; // The fourth field.
        string d = 4;
      }`,
      '3',
    ).nodes
    expect(node?.children?.map(({ description }) => description)).toStrictEqual([
      undefined,
      'The second field.\nSecond line.',
      'The third field.',
      'The fourth field.',
    ])
  })

  it.each([
    [String.raw`\u0041`, 'A'],
    [String.raw`\U0001F600`, '😀'],
    [String.raw`\xA`, '\n'],
    [String.raw`\41`, '!'],
    [String.raw`\x414`, 'A4'],
    [String.raw`\1014`, 'A4'],
  ])('renders a proto2 default with escape %s', (literal, value) => {
    const source = `message M { optional string x = 1 [default = "${literal}"]; }`
    expect(readProtobuf(source, '2').nodes[0]?.children?.[0]?.details).toStrictEqual([
      `Default: ${JSON.stringify(value)}`,
    ])
  })

  it.each(['oneof choice { string a = 1; }', 'reserved 90;'])(
    'preserves next-field documentation after %s',
    (declaration) => {
      const source = `message M {
        ${declaration} /* Documents b. */
        string b = 2;
      }`
      expect(readProtobuf(source, '3').nodes[0]?.children?.at(-1)?.description).toBe('Documents b.')
    },
  )

  it.each(['oneof choice { string a = 1; }', 'reserved 90;', 'enum E { ZERO = 0; }'])(
    'preserves same-line field documentation after %s',
    (declaration) => {
      const source = `message M { ${declaration} /* Documents b. */ string b = 2; }`
      expect(readProtobuf(source, '3').nodes[0]?.children?.at(-1)?.description).toBe('Documents b.')
    },
  )

  it.each([
    '/* Documents the choice. */ oneof choice',
    'oneof choice /* Documents the choice. */',
    'oneof choice /* Documents the choice. */\n',
  ])('preserves inline oneof header documentation: %s', (header) => {
    const source = `message M {
        ${header} {
          string a = 1;
          string b = 2;
        }
      }`
    expect(readProtobuf(source, '3').nodes[0]?.children?.map(({ description }) => description)).toStrictEqual([
      'Documents the choice.',
      undefined,
    ])
  })

  it('keeps a oneof member description when the header also has a block comment', () => {
    const source = `message M {
      /* Documents the choice. */ oneof choice {
        // Documents the first field.
        string a = 1;
      }
    }`
    expect(readProtobuf(source, '3').nodes[0]?.children?.[0]?.description).toBe('Documents the first field.')
  })

  it('preserves next-field documentation when its block comment closes on the field line', () => {
    const source = `message M {
      string a = 1; /* Documents b.
       * Second line. */ string b = 2;
    }`
    expect(readProtobuf(source, '3').nodes[0]?.children?.map(({ description }) => description)).toStrictEqual([
      undefined,
      'Documents b.\nSecond line.',
    ])
  })

  it.each([
    ['float', '-Inf', '-Infinity'],
    ['float', 'INF', 'Infinity'],
    ['bool', 'TRUE', 'true'],
  ])('preserves a proto2 %s default written as %s', (type, value, display) => {
    const source = `message M { optional ${type} x = 1 [default = ${value}]; }`
    expect(readProtobuf(source, '2').nodes[0]?.children?.[0]?.details).toStrictEqual([`Default: ${display}`])
  })

  it.each([
    ['2', 'message M { optional int32 x = 1 [default = +1]; }'],
    ['2', 'message M { optional double x = 1 [default = +1.5]; }'],
    ['3', 'option optimize_for = +1; message M {}'],
  ])('rejects numeric options with an explicit plus sign in proto%s: %s', (version, source) => {
    expect(() => readProtobuf(source, version)).toThrow()
  })

  it('rejects an unquoted boolean as a proto2 string default', () => {
    expect(() => readProtobuf('message M { optional string x = 1 [default = TRUE]; }', '2')).toThrow()
  })

  it('decodes UTF-8 byte escapes across proto2 string tokens', () => {
    const source = String.raw`message M {
      optional string city = 1 [default = "caf\xC3" "\251"];
    }`
    expect(readProtobuf(source, '2').nodes[0]?.children?.[0]?.details).toStrictEqual(['Default: "café"'])
  })

  it('displays the exact octets of proto2 bytes defaults', () => {
    const source = String.raw`message M {
      optional bytes raw = 1 [default = "é"];
      optional bytes unicode = 2 [default = "\u00E9"];
      optional bytes utf8 = 3 [default = "\xC3\xA9"];
      optional bytes octet = 4 [default = "\xE9"];
    }`
    expect(readProtobuf(source, '2').nodes[0]?.children?.map(({ details }) => details)).toStrictEqual([
      [String.raw`Default: "\xc3\xa9"`],
      [String.raw`Default: "\xc3\xa9"`],
      [String.raw`Default: "\xc3\xa9"`],
      [String.raw`Default: "\xe9"`],
    ])
  })

  it.each([
    'string id = 1 /* Stable identifier. */;',
    'map<string, string> id = 1 /* Stable identifier. */;',
    'string\n/* Stable identifier. */\nid = 1;',
    'map<string, string>\n/* Stable identifier. */ id = 1;',
    'oneof identity { string id = /* Stable identifier. */ 1; }',
    'string id = 1 [deprecated = /* Stable identifier. */ true];',
  ])('preserves descriptions within field declarations: %s', (field) => {
    const source = `message M { ${field} }`
    expect(readProtobuf(source, '3').nodes[0]?.children?.[0]?.description).toBe('Stable identifier.')
  })

  it('keeps consecutive comments between the tokens of a wrapped field', () => {
    const source = `message M {
      optional string
      // First line.
      // Second line.
      id = 1;
    }`
    expect(readProtobuf(source, '2').nodes[0]?.children?.[0]?.description).toBe('First line.\nSecond line.')
  })

  it('leaves out detached comments after a field number', () => {
    const source = 'message M { string id = 1\n/* Detached. */; }'
    expect(readProtobuf(source, '3').nodes[0]?.children?.map(({ description }) => description)).toStrictEqual([
      undefined,
    ])
  })

  it('preserves inline enum value descriptions', () => {
    const source = 'enum E { ZERO = /* Default value. */ 0; }'
    expect(readProtobuf(source, '3').nodes[0]?.children?.[0]?.description).toBe('Default value.')
  })

  it('uses leading comments before inline and trailing comments', () => {
    const source = `message M {
      // Leading description.
      string id = 1 /* Inline description. */; // Trailing description.
    }`
    expect(readProtobuf(source, '3').nodes[0]?.children?.[0]?.description).toBe('Leading description.')
  })

  it('keeps a continued trailing comment on the same field', () => {
    const [node] = readProtobuf(
      `message M {
        string x = 1; // First line.
        // Second line.
        string y = 2;
      }`,
      '3',
    ).nodes
    expect(node?.children?.map(({ description }) => description)).toStrictEqual([
      'First line.\nSecond line.',
      undefined,
    ])
  })

  it.each(['2', '3'])('preserves descriptions inside wrapped proto%s declaration headers', (version) => {
    const source = `message
      // Payload tracked by the carrier.
      Envelope {}
      enum
      /* Delivery status. */
      Status { QUEUED = 0; }
    `
    const nodes = readProtobuf(source, version).nodes
    expect(nodes.map(({ name, description }) => ({ name, description }))).toStrictEqual([
      { name: 'Envelope', description: 'Payload tracked by the carrier.' },
      { name: 'Status', description: 'Delivery status.' },
    ])
  })

  it('preserves descriptions after a top-level empty statement', () => {
    const source = 'message A {}; // Documents B.\nmessage B {}'
    expect(readProtobuf(source, '3').nodes[1]?.description).toBe('Documents B.')
  })

  it('preserves next-field descriptions after a nested empty statement', () => {
    const source = `message M {
      oneof choice { string a = 1; }; // Documents b.
      string b = 2;
    }`
    expect(readProtobuf(source, '3').nodes[0]?.children?.at(-1)?.description).toBe('Documents b.')
  })

  it('preserves comments across file metadata and top-level declarations', () => {
    const { nodes } = readProtobuf(
      `/* The message. */
      package example; option feature = .test.VALUE; message M {} // The enum.
      enum E { ZERO = 0; }`,
      '3',
    )
    expect(nodes.map(({ name, description }) => ({ name, description }))).toStrictEqual([
      { name: 'M', description: 'The message.' },
      { name: 'E', description: 'The enum.' },
    ])
  })

  it.each(['2', '3'])('decodes adjacent string literals in a proto%s syntax declaration', (version) => {
    const source = `syntax = "proto" '${version}'; message M { optional string value = 1; }`
    expect(readProtobuf(source, version).nodes[0]?.children?.[0]?.name).toBe('value')
  })

  it('renders compact schemas', () => {
    expect(readProtobuf('message M{string x=1;}', '3').nodes[0]?.children?.[0]?.name).toBe('x')
    expect(readProtobuf('message M{}', '3').nodes[0]?.type).toBe('message M')
  })

  it('rejects a partially parsed file and accepts trailing comments', () => {
    expect(() => readProtobuf('message M {} garbage', '3')).toThrow('Trailing Protobuf source')
    expect(readProtobuf('message M {} // trailing comment\n', '3').nodes[0]?.type).toBe('message M')
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
