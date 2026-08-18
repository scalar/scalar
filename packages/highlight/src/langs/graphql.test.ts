import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import graphql from './graphql'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(graphql)

const known = new Set(Object.keys(SCOPES))

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (code: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(code, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (code: string, lang: string): [string, string][] => {
  return runs(code, lang).filter((r) => r[1] !== null) as [string, string][]
}

const assertHas = (code: string, lang: string, text: string, scope: string): void => {
  const pairs = scoped(code, lang)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope} in ${lang}, got ${JSON.stringify(
      pairs.filter(([t]) => t === text),
    )}`,
  ).toBeTruthy()
}

/**
 * A schema and an executable document in one file, which is how a GraphQL
 * grammar gets stressed: the two halves reuse `name:`, `(…)` and `{…}` for
 * different things, and only the surrounding shape says which is which.
 */
const SAMPLE = `# Public API schema for the demo service.
"""
A registered user.

A description may contain a literal \\""" sequence.
"""
type User implements Node & Timestamped @key(fields: "id") {
  id: ID!
  "The name rendered in the UI."
  displayName: String!
  email: String @deprecated(reason: "Use \\"contact\\" instead.")
  posts(first: Int = 10, after: String, tags: [String!] = []): PostConnection!
  role: Role!
}

interface Node {
  id: ID!
}

union SearchResult = User | Post

enum Role {
  ADMIN
  EDITOR
  VIEWER
}

input PostFilter {
  search: String = ""
  minScore: Float = 0.5
  limit: Int = 25
  published: Boolean = true
  cursor: ID = null
}

scalar DateTime @specifiedBy(url: "https://scalars.graphql.org/datetime")

directive @auth(requires: Role = VIEWER) repeatable on FIELD_DEFINITION | OBJECT

extend type Query {
  search(filter: PostFilter): [SearchResult!]!
}

schema {
  query: Query
  mutation: Mutation
}

query FeedPage($first: Int! = 20, $cursor: ID, $withPosts: Boolean! = true) {
  viewer {
    __typename
    handle: displayName
    posts(first: $first, after: $cursor) @include(if: $withPosts) {
      edges {
        node { ...PostFields }
      }
    }
  }
}

fragment PostFields on Post {
  id
  title
  author {
    ... on User { displayName }
  }
}

mutation Publish($id: ID!) {
  publishPost(id: $id, at: 1.5e3, meta: { pinned: false, weight: -2 }) {
    ok
  }
}

subscription OnPostPublished {
  postPublished(topic: "feed\\n") { id }
}
`

describe('graphql', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'graphql')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'graphql')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'graphql')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `graphql emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'graphql'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: this is what an
    // editor feeds the highlighter on every keystroke, and a block string or an
    // argument list cut in half is the usual way to reach one.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'graphql')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('tells a field, an argument name and a type reference apart', () => {
    const code = 'type Query {\n  user(id: ID!): User\n}\n'
    assertHas(code, 'graphql', 'user', 'property')
    assertHas(code, 'graphql', 'id', 'variable.parameter')
    assertHas(code, 'graphql', 'ID', 'type.builtin')
    assertHas(code, 'graphql', 'User', 'type')
  })

  it('scopes an alias and the field it aliases', () => {
    const code = '{\n  handle: displayName\n  displayName\n}\n'
    assertHas(code, 'graphql', 'handle', 'property')
    // The selected field carries a scope too. Leaving it bare made the alias
    // stand out but left the body of a query at the block foreground, which is
    // the part a reader came for. The `alias: field` shape still reads.
    assertHas(code, 'graphql', 'displayName', 'property')
  })

  it('separates a builtin scalar from a user-defined type', () => {
    const code = 'type Event {\n  id: ID!\n  at: DateTime!\n  label: String\n}\n'
    assertHas(code, 'graphql', 'ID', 'type.builtin')
    assertHas(code, 'graphql', 'String', 'type.builtin')
    assertHas(code, 'graphql', 'DateTime', 'type')
    assertHas(code, 'graphql', 'Event', 'class')
  })

  it('scopes a type definition, its supertypes and the directive on it', () => {
    const code = 'type User implements Node & Timestamped @key(fields: "id") {\n  id: ID!\n}\n'
    assertHas(code, 'graphql', 'type', 'keyword.declaration')
    assertHas(code, 'graphql', 'User', 'class')
    assertHas(code, 'graphql', 'implements', 'keyword')
    assertHas(code, 'graphql', 'Node', 'type')
    assertHas(code, 'graphql', '&', 'operator')
    assertHas(code, 'graphql', '@key', 'decorator')
    assertHas(code, 'graphql', 'fields', 'variable.parameter')
  })

  it('tells a directive from the keyword that declares one', () => {
    const code = 'directive @auth(requires: Role = VIEWER) repeatable on FIELD_DEFINITION\n'
    assertHas(code, 'graphql', 'directive', 'keyword.declaration')
    assertHas(code, 'graphql', '@auth', 'decorator')
    assertHas(code, 'graphql', 'repeatable', 'keyword')
    assertHas(code, 'graphql', 'on', 'keyword')
    assertHas(code, 'graphql', 'FIELD_DEFINITION', 'constant')
  })

  it('tells a variable from the argument it fills and the field around it', () => {
    const code = 'query Hero($ep: Episode) {\n  hero(episode: $ep) @include(if: $ep) {\n    name\n  }\n}\n'
    assertHas(code, 'graphql', 'query', 'keyword.declaration')
    assertHas(code, 'graphql', 'Hero', 'function')
    assertHas(code, 'graphql', '$ep', 'variable')
    assertHas(code, 'graphql', 'episode', 'variable.parameter')
    assertHas(code, 'graphql', 'if', 'variable.parameter')
    // The field is a property; an argument name inside the list is not, which
    // is the distinction this grammar exists to draw.
    assertHas(code, 'graphql', 'hero', 'property')
  })

  it('reads a fragment spread as a call and a type condition as a keyword', () => {
    const code = 'fragment PostFields on Post {\n  id\n}\n\n{\n  ...PostFields\n  ... on User {\n    id\n  }\n}\n'
    assertHas(code, 'graphql', 'PostFields', 'function')
    assertHas(code, 'graphql', 'PostFields', 'function.call')
    assertHas(code, 'graphql', '...', 'operator')
    assertHas(code, 'graphql', 'on', 'keyword')
    assertHas(code, 'graphql', 'User', 'type')
  })

  it('scopes enum values apart from the enum they belong to', () => {
    const code = 'enum Role {\n  ADMIN\n  VIEWER\n}\n'
    assertHas(code, 'graphql', 'enum', 'keyword.declaration')
    assertHas(code, 'graphql', 'Role', 'class')
    assertHas(code, 'graphql', 'ADMIN', 'constant')
  })

  it('reads a leading block string as documentation and an argument string as a value', () => {
    const code = '"""\nA user.\n"""\ntype User {\n  name(format: "short"): String\n}\n'
    assertHas(code, 'graphql', '"""\nA user.\n"""', 'comment.doc')
    assertHas(code, 'graphql', '"short"', 'string')
    assertHas(code, 'graphql', 'name', 'property')
  })

  it('scopes escapes inside an ordinary string', () => {
    const code = '{\n  post(body: "line\\nbreak \\"quoted\\"") { id }\n}\n'
    assertHas(code, 'graphql', '\\n', 'string.escape')
    assertHas(code, 'graphql', '\\"', 'string.escape')
  })

  it('handles int, float and exponent literals', () => {
    for (const literal of ['10', '0.5', '1.5e3', '2e-3', '-2']) {
      assertHas(`{ f(n: ${literal}) }\n`, 'graphql', literal, 'number')
    }
  })

  it('scopes the non-null, list and delimiter punctuation', () => {
    const code = 'type Q {\n  tags: [String!]!\n}\n'
    assertHas(code, 'graphql', '!', 'operator')
    assertHas(code, 'graphql', '[', 'punctuation.bracket')
    assertHas(code, 'graphql', ':', 'punctuation.delimiter')
  })

  it('recovers an argument list that is never closed', () => {
    // `args` used to pop only on `)`, so one missing parenthesis re-scoped
    // everything after it: fields read as arguments, and a description read as
    // a plain string because the root-only rules had become unreachable.
    const code =
      'query {\n  f(a: 1\n}\n\ntype Book {\n  title: String\n  author: Author\n}\n\n"""\nA shelf.\n"""\ntype Shelf {\n  id: ID\n}\n'
    assertHas(code, 'graphql', 'title', 'property')
    assertHas(code, 'graphql', 'author', 'property')
    assertHas(code, 'graphql', '"""\nA shelf.\n"""', 'comment.doc')
    // Nothing after the broken line is an argument any more.
    expect(scoped(code, 'graphql').filter(([, s]) => s === 'variable.parameter')).toEqual([['a', 'variable.parameter']])
  })

  it('keeps an object value inside an argument list scoped as one', () => {
    // The braces of an object value re-enter `args`, which is what lets a brace
    // double as the recovery above without losing the field names inside it.
    const code = '{\n  publish(id: 1, meta: { pinned: false, weight: -2 }) { ok }\n}\n'
    assertHas(code, 'graphql', 'meta', 'variable.parameter')
    assertHas(code, 'graphql', 'pinned', 'variable.parameter')
    assertHas(code, 'graphql', 'false', 'boolean')
    assertHas(code, 'graphql', '-2', 'number')
    // The list still closes on its own parenthesis, so what follows is a
    // selection set and `ok` in it is a field rather than another argument.
    assertHas(code, 'graphql', 'ok', 'property')
  })

  it('treats an introspection meta-field as special', () => {
    assertHas('{\n  __typename\n  id\n}\n', 'graphql', '__typename', 'variable.special')
  })
})
