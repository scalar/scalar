# `@scalar/validation`

Small, schema-first helpers to **check** unknown data and **coerce** it into predictable shapes. Schemas are plain JavaScript objects (easy to serialize or log), and TypeScript can infer output types with `Static`.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdks/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

## Install

This package lives in the Scalar monorepo. In workspace consumers:

```bash
pnpm add @scalar/validation
```

## Quick start

```ts
import { coerce, number, object, string, validate, type Static } from '@scalar/validation'

const userSchema = object({
  id: number(),
  name: string(),
})

type User = Static<typeof userSchema>

validate(userSchema, { id: 1, name: 'Ada' }) // true
validate(userSchema, { id: 1, name: 2 }) // false

// Best-effort shaping: invalid primitives fall back to defaults
coerce(userSchema, { id: 'x', name: 'Ada' }) // { id: 0, name: 'Ada' }
```

## Concepts

### `validate(schema, value)`

Returns `true` if `value` satisfies `schema`, otherwise `false`.

- **`undefined` schema** — always fails.
- **`number()`** — finite numbers only (`NaN` and `Infinity` fail).
- **`object({ ... })`** — value must be a **plain object** (see [Objects and records](#objects-and-records)). Each declared property is validated; **extra properties are not rejected**.
- **`union([...])`** — matches if **any** branch matches.

### `coerce(schema, value)`

Returns a value typed as `Static<typeof schema>`. It is **not** strict validation: it **normalizes** toward the schema.

- Valid primitives are returned as-is.
- Invalid **number** → `0`, invalid **string** → `''`, invalid **boolean** → `false`.
- **`nullable()`** — result is always `null`.
- **`notDefined()`** — result is always `undefined`.
- **`literal(x)`** — result is always the schema’s literal `x` (the declared constant).
- **`array` / `object` / `record`** — built recursively; wrong shapes become empty containers or defaulted fields.
- **`union`** — picks a branch using a **scoring** heuristic (object shape and literal tags weigh more than “property exists”).
- Optional third argument: internal **`WeakMap` cache** for cyclic graphs; you normally omit it.

Use **`validate`** when you need a yes/no. Use **`coerce`** when you want a stable default-filled structure (for example normalizing config or parsed JSON).

## Schema builders

| Builder | Validates | `Static` type (idea) |
|--------|-----------|----------------------|
| `number()` | Finite `number` | `number` |
| `string()` | `string` | `string` |
| `boolean()` | `boolean` | `boolean` |
| `nullable()` | `null` only | `null` |
| `notDefined()` | `undefined` only | `undefined` |
| `any()` | Anything | `any` |
| `literal(v)` | Strict equality to `v` | `typeof v` |
| `array(item)` | Array; every item matches `item` | `Static<item>[]` |
| `record(key, value)` | Plain object; keys and values match | `Record<…, …>` |
| `object(props)` | Plain object; each key in `props` | Object of static fields |
| `union([a, b, …])` | Matches any member | Union of branches |
| `optional(s)` | `undefined` or matches `s` | `Static<s> \| undefined`; in `object({ … })`, property becomes `key?: Static<s>` |
| `lazy(() => schema)` | Defers schema (recursion) | Inferred from inner schema |
| `evaluate(fn, schema)` | Runs `fn(value)` then validates `schema` | `Static<schema>` |

```ts
import { lazy, object, string, union, literal } from '@scalar/validation'

// Discriminated-style union
const message = union([
  object({ type: literal('text'), body: string() }),
  object({ type: literal('ping') }),
])
```

### `evaluate` — parse then validate

```ts
import { evaluate, number, string } from '@scalar/validation'

const trimmed = evaluate((v) => (typeof v === 'string' ? v.trim() : v), string())

validate(trimmed, '  hi  ') // true (after trim)
```

## Objects and records

**Plain object** means: not `null`, and prototype is `Object.prototype` or `null`. Arrays, `Date`, and most class instances **do not** count as objects for `object()` / `record()` validation.

**`object`** checks only the keys you list. Missing keys are read as `undefined`, so pair them with `optional(...)` when a field may be absent.

**`record`** during **validation** checks every key against the key schema and every value against the value schema. During **coercion**, entries keep their string keys as-is and only values are coerced.

## TypeScript: `Static` and `Schema`

- **`Static<S>`** — inferred TypeScript type for data that matches schema `S` (depth-limited to avoid infinite recursion on very deep types).
- **`Schema`** — union of all schema shapes; use when you store or pass schemas around.

## Development

```bash
pnpm --filter @scalar/validation test
pnpm --filter @scalar/validation types:check
pnpm --filter @scalar/validation build
```

## License

MIT
