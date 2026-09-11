# Evaluation results

The same seven fixtures and 37 checks were used for the baseline and all five improvement rounds. Checks and their weights did not change. The final package configuration requires all checks to pass.

| Run      | Change                                                              | Passed |
| -------- | ------------------------------------------------------------------- | ------ |
| baseline | Original renderer                                                   | 27/37  |
| round-1  | Preserve operation IDs                                              | 28/37  |
| round-2  | Preserve request body descriptions and required flags               | 30/37  |
| round-3  | Render non-object component schemas and remove empty example labels | 33/37  |
| round-4  | Render alternatives inside object properties                        | 34/37  |
| round-5  | Render numeric and string constraints                               | 37/37  |

Final validation also passes 37/37 after removing a misleading inferred type and a repeated component description. All 48 package tests pass. This corpus measures selected features, not complete OpenAPI support. See [the evaluation guide](./README.md) for commands and limits.

## Output samples

These are actual Markdown outputs from the baseline and final validation. Run with `MARKDOWN_EVALUATION_OUTPUT` to inspect the complete corpus and per-check JSON report.

### component-schemas

#### Before

```markdown
# Evaluation API

- **OpenAPI Version:** `3.1.1`
- **API Version:** `1`

## Schemas

### Status

- **Type:**`string`

**Example:**

### Names

- **Type:**`array`

**Example:**
```

#### After

```markdown
# Evaluation API

- **OpenAPI Version:** `3.1.1`
- **API Version:** `1`

## Schemas

### Status

- **Type:**`string`

`string`, possible values: `"pending", "complete"`, default: `"pending"`

### Names

- **Type:**`array`

**Array of:**

`string`, format: `email`
```

### nested-composition

#### Before

````markdown
# Evaluation API

- **OpenAPI Version:** `3.1.1`
- **API Version:** `1`

## Operations

### GET /choice

- **Method:** `GET`
- **Path:** `/choice`

#### Responses

##### Status: 200 Choice

###### Content-Type: application/json

- **`value`**

  `object`

**Example:**

```json
{
  "value": "chosen"
}
```
````

#### After

````markdown
# Evaluation API

- **OpenAPI Version:** `3.1.1`
- **API Version:** `1`

## Operations

### GET /choice

- **Method:** `GET`
- **Path:** `/choice`

#### Responses

##### Status: 200 Choice

###### Content-Type: application/json

- **`value`**

  **One of:**

  `string`, possible values: `"chosen"`

  `integer`, format: `int64`

**Example:**

```json
{
  "value": "chosen"
}
```
````

### schema-constraints

#### Before

```markdown
# Evaluation API

- **OpenAPI Version:** `3.1.1`
- **API Version:** `1`

## Operations

### GET /search

- **Method:** `GET`
- **Path:** `/search`

#### Parameters

##### `limit`

- **In:** `query`

`integer`

##### `query`

- **In:** `query`

`string`

#### Responses

##### Status: 200 Results
```

#### After

```markdown
# Evaluation API

- **OpenAPI Version:** `3.1.1`
- **API Version:** `1`

## Operations

### GET /search

- **Method:** `GET`
- **Path:** `/search`

#### Parameters

##### `limit`

- **In:** `query`

* minimum: `0`
* maximum: `100`

`integer`

##### `query`

- **In:** `query`

* minLength: `0`
* maxLength: `32`
* pattern: `^[a-z]+$`

`string`

#### Responses

##### Status: 200 Results
```
