import type { Grammar } from '../core/types'

/** Protobuf source (proto2, proto3 and Editions), including service declarations. */
const protobuf: Grammar = {
  name: 'protobuf',
  aliases: ['proto'],
  states: {
    root: {
      rules: [
        { include: 'comments' },
        { match: '"', scope: 'string', push: 'double-string' },
        { match: "'", scope: 'string', push: 'single-string' },
        { match: '\\b(?:message|enum|service|group)\\b(?!\\s*=)', scope: 'keyword.declaration', push: 'type-name' },
        { match: '\\brpc\\b(?!\\s*=)', scope: 'keyword.declaration', push: 'rpc-name' },
        { match: '\\bpackage\\b(?!\\s*=)', scope: 'keyword.declaration', push: 'package-name' },
        { match: '\\boneof\\b(?!\\s*=)', scope: 'keyword.declaration', push: 'field-name' },
        { match: '\\bimport\\b(?!\\s*=)', scope: 'keyword.import' },
        { match: '\\b(?:syntax|edition)\\b(?=\\s*=\\s*["\'])', scope: 'keyword' },
        { match: '\\boption\\b(?!\\s*=)', scope: 'keyword', push: 'option-name' },
        // A field or option may use a keyword as its name. Its assignment
        // shape takes priority over the remaining keyword and type rules.
        { match: '\\b[A-Za-z_][\\w]*\\b(?=\\s*=)', scope: 'property' },
        {
          match:
            '\\b(?:optional|required|repeated|reserved|extensions|extend|to|max|returns|stream|public|weak|export|local)\\b',
          scope: 'keyword',
        },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        {
          match:
            '\\b(?:double|float|int32|int64|uint32|uint64|sint32|sint64|fixed32|fixed64|sfixed32|sfixed64|bool|string|bytes|map)\\b',
          scope: 'type.builtin',
        },
        {
          match:
            '(?<![\\w.])[-+]?(?:0[xX][0-9a-fA-F]+|(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][-+]?[0-9]+)?|inf\\b|nan\\b)',
          scope: 'number',
        },
        // User types need not be PascalCase. A name before another name is
        // a field type; RPC and map arguments end at a closing bracket.
        {
          match: '(?<![\\w.])\\.?[A-Za-z_]\\w*(?:\\.[A-Za-z_]\\w*)*\\b(?=(?:\\s+[A-Za-z_]|\\s*[>)]))',
          scope: 'type',
        },
        // Enum constants conventionally use capitals. Assignment names above
        // remain properties, just like field names, without needing a parser.
        { match: '\\b[A-Z][A-Z0-9_]*\\b', scope: 'constant' },
        { match: '\\b[A-Z]\\w*\\b', scope: 'type' },
        { match: '\\b[A-Za-z_]\\w*(?=\\s*:)', scope: 'property' },
        { match: '[{}\\[\\]()<>]', scope: 'punctuation.bracket' },
        { match: '=', scope: 'operator' },
        { match: '[;,:.]', scope: 'punctuation.delimiter' },
      ],
    },
    comments: {
      rules: [
        { match: '//[^\\n]*', scope: 'comment' },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },
      ],
    },
    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', scope: 'comment', pop: true }],
    },
    'type-name': {
      rules: [
        { include: 'comments' },
        { match: '[A-Za-z_]\\w*', scope: 'class', pop: true },
        { match: '(?=\\S)', pop: true },
      ],
    },
    'rpc-name': {
      rules: [
        { include: 'comments' },
        { match: '[A-Za-z_]\\w*', scope: 'function', pop: true },
        { match: '(?=\\S)', pop: true },
      ],
    },
    'field-name': {
      rules: [
        { include: 'comments' },
        { match: '[A-Za-z_]\\w*', scope: 'property', pop: true },
        { match: '(?=\\S)', pop: true },
      ],
    },
    // Custom options may name an extension in parentheses, followed by a
    // field path. Keep that whole name out of the RPC type heuristic.
    'option-name': {
      rules: [
        { include: 'comments' },
        { match: '(?:\\([.\\w]+\\)|[A-Za-z_]\\w*)(?:\\.[A-Za-z_]\\w*)*', scope: 'property', pop: true },
        { match: '(?=\\S)', pop: true },
      ],
    },
    'package-name': {
      rules: [
        { include: 'comments' },
        { match: '[A-Za-z_]\\w*(?:\\.[A-Za-z_]\\w*)*', scope: 'namespace', pop: true },
        { match: '(?=\\S)', pop: true },
      ],
    },
    'double-string': {
      default: 'string',
      rules: [{ include: 'escapes' }, { match: '"', scope: 'string', pop: true }, { match: '$', pop: true }],
    },
    'single-string': {
      default: 'string',
      rules: [{ include: 'escapes' }, { match: "'", scope: 'string', pop: true }, { match: '$', pop: true }],
    },
    escapes: {
      rules: [
        {
          match: '\\\\(?:[xX][0-9a-fA-F]{1,2}|[0-7]{1,3}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[^\\r\\n])',
          scope: 'string.escape',
        },
      ],
    },
  },
}

export default protobuf
