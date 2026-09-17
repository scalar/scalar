# Markdown benchmark

- **OpenAPI Version:** `3.1.1`
- **API Version:** `1.0`
- **Terms of service:**<https://example.com/terms>
- **Contact:** API Team <https://example.com/contact><team@example.com>
- **License:**[MIT](https://example.com/license)

A shared object used by this API.

## Servers

- **URL:** `https://example.com/api`

#### Authentication

- **bearer**
  ```
  {
    "type": "http",
    "scheme": "bearer"
  }
  ```

## Tags

### Resources

Resource operations

## Operations

### Resource 0

- **Method:** `POST`
- **Path:** `/resources/0`
- **Tags:** Resources

A shared object used by this API.

#### Effective servers

- `https://example.com/api`

#### Authentication

- **bearer**
  ```
  {
    "type": "http",
    "scheme": "bearer"
  }
  ```

#### Parameters

##### `limit`

- **In:** `query`

`integer`, default: `10`

#### Request Body

##### Content-Type: application/json

- **`field0` (required)**

  `string` — Field 0

- **`field1`**

  `string` — Field 1

- **`field2`**

  `string` — Field 2

- **`owner`**

  `object`

  - **`id`**

    `integer`

  - **`name`**

    `string`

- **`parent`**

  `object` — A shared object used by this API.

  - **`field0` (required)**

    `string` — Field 0

  - **`field1`**

    `string` — Field 1

  - **`field2`**

    `string` — Field 2

  - **`owner`**

    `object`

    - **`id`**

      `integer`

    - **`name`**

      `string`

  - **`parent`**

    `object` — A shared object used by this API.

    *\[Circular Reference]*

**Example:**

```json
{
  "field0": "value0",
  "field1": "value1",
  "field2": "value2",
  "owner": null,
  "parent": null
}
```

#### Responses

##### Status: 200 Success

###### Content-Type: application/json

- **`field0` (required)**

  `string` — Field 0

- **`field1`**

  `string` — Field 1

- **`field2`**

  `string` — Field 2

- **`owner`**

  `object`

  - **`id`**

    `integer`

  - **`name`**

    `string`

- **`parent`**

  `object` — A shared object used by this API.

  - **`field0` (required)**

    `string` — Field 0

  - **`field1`**

    `string` — Field 1

  - **`field2`**

    `string` — Field 2

  - **`owner`**

    `object`

    - **`id`**

      `integer`

    - **`name`**

      `string`

  - **`parent`**

    `object` — A shared object used by this API.

    *\[Circular Reference]*

**Example:**

```json
{
  "field0": "value0",
  "field1": "value1",
  "field2": "value2",
  "owner": null,
  "parent": null
}
```

##### Status: 201 XML result

###### Content-Type: application/xml

- **`name`**

  `string`

**Example:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<result>
  <name>value</name>
</result>
```

### Resource 1

- **Method:** `POST`
- **Path:** `/resources/1`
- **Tags:** Resources

A shared object used by this API.

#### Effective servers

- `https://example.com/api`

#### Authentication

- **bearer**
  ```
  {
    "type": "http",
    "scheme": "bearer"
  }
  ```

#### Parameters

##### `limit`

- **In:** `query`

`integer`, default: `10`

#### Request Body

##### Content-Type: application/json

- **`field0` (required)**

  `string` — Field 0

- **`field1`**

  `string` — Field 1

- **`field2`**

  `string` — Field 2

- **`owner`**

  `object`

  - **`id`**

    `integer`

  - **`name`**

    `string`

- **`parent`**

  `object` — A shared object used by this API.

  - **`field0` (required)**

    `string` — Field 0

  - **`field1`**

    `string` — Field 1

  - **`field2`**

    `string` — Field 2

  - **`owner`**

    `object`

    - **`id`**

      `integer`

    - **`name`**

      `string`

  - **`parent`**

    `object` — A shared object used by this API.

    *\[Circular Reference]*

**Example:**

```json
{
  "field0": "value0",
  "field1": "value1",
  "field2": "value2",
  "owner": null,
  "parent": null
}
```

#### Responses

##### Status: 200 Success

###### Content-Type: application/json

- **`field0` (required)**

  `string` — Field 0

- **`field1`**

  `string` — Field 1

- **`field2`**

  `string` — Field 2

- **`owner`**

  `object`

  - **`id`**

    `integer`

  - **`name`**

    `string`

- **`parent`**

  `object` — A shared object used by this API.

  - **`field0` (required)**

    `string` — Field 0

  - **`field1`**

    `string` — Field 1

  - **`field2`**

    `string` — Field 2

  - **`owner`**

    `object`

    - **`id`**

      `integer`

    - **`name`**

      `string`

  - **`parent`**

    `object` — A shared object used by this API.

    *\[Circular Reference]*

**Example:**

```json
{
  "field0": "value0",
  "field1": "value1",
  "field2": "value2",
  "owner": null,
  "parent": null
}
```

## Webhooks

### Event notification

- **Method:** `POST`
- **Webhook:** `event`

#### Effective servers

- `https://example.com/api`

#### Authentication

- **bearer**
  ```
  {
    "type": "http",
    "scheme": "bearer"
  }
  ```

#### Request Body

**Required:** true

##### Content-Type: application/json

- **`id`**

  `integer`

- **`name`**

  `string`

**Example:**

```json
{
  "id": 1,
  "name": ""
}
```

#### Responses

##### Status: 204 Received

## Schemas

### Resource

- **Type:**`object`

A shared object used by this API.

- **`field0` (required)**

  `string` — Field 0

- **`field1`**

  `string` — Field 1

- **`field2`**

  `string` — Field 2

- **`owner`**

  `object`

  - **`id`**

    `integer`

  - **`name`**

    `string`

- **`parent`**

  `object` — A shared object used by this API.

  - **`field0` (required)**

    `string` — Field 0

  - **`field1`**

    `string` — Field 1

  - **`field2`**

    `string` — Field 2

  - **`owner`**

    `object`

    - **`id`**

      `integer`

    - **`name`**

      `string`

  - **`parent`**

    `object` — A shared object used by this API.

    *\[Circular Reference]*

**Example:**

```json
{
  "field0": "value0",
  "field1": "value1",
  "field2": "value2",
  "owner": {
    "id": 1,
    "name": ""
  },
  "parent": {
    "field0": "value0",
    "field1": "value1",
    "field2": "value2",
    "owner": null,
    "parent": null
  }
}
```

### Owner

- **Type:**`object`

* **`id`**

  `integer`

* **`name`**

  `string`

**Example:**

```json
{
  "id": 1,
  "name": ""
}
```

