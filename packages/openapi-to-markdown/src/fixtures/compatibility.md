# Markdown benchmark

- **OpenAPI Version:** `3.2.0`
- **API Version:** `1.0`
- **Terms of service:** <https://example.com/terms>
- **Contact:** API Team <https://example.com/contact> <team@example.com>
- **License:** [MIT](https://example.com/license)

A shared object used by this API.

## Servers

- **URL:** `https://example.com/api`

## Authentication

- **bearer**: HTTP bearer

## Tags

### Resources

Resource operations

## Operations

### Resource 0

- **Method:** `POST`
- **Path:** `/resources/0`
- **Operation ID:** `resource0`
- **Tags:** Resources

A shared object used by this API.

#### Effective servers

- `https://example.com/api`

#### Authentication

- **bearer**: HTTP bearer

#### Query parameters

- **`limit`**: `integer`, default: `10`

#### Request body

**Content type:** `application/json`

[Resource](#scalar-schema-resource)

A shared object used by this API.

<a id="scalar-example-1"></a>

**Generated example:**

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
    "owner": {
      "id": 1,
      "name": ""
    },
    "parent": {
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
        "owner": {
          "id": 1,
          "name": ""
        },
        "parent": {
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
            "owner": {
              "id": 1,
              "name": ""
            },
            "parent": {
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
                "owner": {
                  "id": 1,
                  "name": ""
                },
                "parent": {
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
                    "owner": {
                      "id": 1,
                      "name": ""
                    },
                    "parent": {
                      "field0": "value0",
                      "field1": "value1",
                      "field2": "value2",
                      "owner": {},
                      "parent": {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

#### Responses

##### 200 Success

**Content type:** `application/json`

[Resource](#scalar-schema-resource)

A shared object used by this API.

<a id="scalar-example-2"></a>

**Generated example:**

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
    "owner": {
      "id": 1,
      "name": ""
    },
    "parent": {
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
        "owner": {
          "id": 1,
          "name": ""
        },
        "parent": {
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
            "owner": {
              "id": 1,
              "name": ""
            },
            "parent": {
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
                "owner": {
                  "id": 1,
                  "name": ""
                },
                "parent": {
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
                    "owner": {
                      "id": 1,
                      "name": ""
                    },
                    "parent": {
                      "field0": "value0",
                      "field1": "value1",
                      "field2": "value2",
                      "owner": {},
                      "parent": {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

##### 201 XML result

**Content type:** `application/xml`

- **`name`**: `string`

<a id="scalar-example-3"></a>

**Generated example:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<result>
  <name>value</name>
</result>
```

### Resource 1

- **Method:** `POST`
- **Path:** `/resources/1`
- **Operation ID:** `resource1`
- **Tags:** Resources

A shared object used by this API.

#### Effective servers

- `https://example.com/api`

#### Authentication

- **bearer**: HTTP bearer

#### Query parameters

- **`limit`**: `integer`, default: `10`

#### Request body

**Content type:** `application/json`

[Resource](#scalar-schema-resource)

A shared object used by this API.

[Generated example](#scalar-example-1)

#### Responses

##### 200 Success

**Content type:** `application/json`

[Resource](#scalar-schema-resource)

A shared object used by this API.

[Generated example](#scalar-example-2)

## Webhooks

### Event notification

- **Method:** `POST`
- **Webhook:** `event`

#### Effective servers

- `https://example.com/api`

#### Authentication

- **bearer**: HTTP bearer

#### Request body

**Required:** `true`

**Content type:** `application/json`

[Owner](#scalar-schema-owner)

<a id="scalar-example-4"></a>

**Generated example:**

```json
{
  "id": 1,
  "name": ""
}
```

#### Responses

##### 204 Received

## Schemas

<a id="scalar-schema-resource"></a>

### Resource

**Type:** `object`

A shared object used by this API.

- **`field0` (required)**: `string`

  Field 0
- **`field1`**: `string`

  Field 1
- **`field2`**: `string`

  Field 2
- **`owner`**: [Owner](#scalar-schema-owner)
- **`parent`**: [Resource](#scalar-schema-resource)

  A shared object used by this API.

<a id="scalar-example-5"></a>

**Generated example:**

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
    "owner": {
      "id": 1,
      "name": ""
    },
    "parent": {
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
        "owner": {
          "id": 1,
          "name": ""
        },
        "parent": {
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
            "owner": {
              "id": 1,
              "name": ""
            },
            "parent": {
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
                "owner": {
                  "id": 1,
                  "name": ""
                },
                "parent": {
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
                    "owner": {
                      "id": 1,
                      "name": ""
                    },
                    "parent": {
                      "field0": "value0",
                      "field1": "value1",
                      "field2": "value2",
                      "owner": {},
                      "parent": {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

<a id="scalar-schema-owner"></a>

### Owner

**Type:** `object`

- **`id`**: `integer`
- **`name`**: `string`

<a id="scalar-example-6"></a>

**Generated example:**

```json
{
  "id": 1,
  "name": ""
}
```
