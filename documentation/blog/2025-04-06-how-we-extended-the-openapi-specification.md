# How we extended the OpenAPI specification

We love OpenAPI, but as a team that develops a suite of tools built around it, sometimes we can find it limited. Luckily, because we control how the OpenAPI document is processed and displayed, we can do something about this.

We recently [extended the OpenAPI specification](https://github.com/scalar/scalar/blob/main/documentation/openapi.md) with some features we wanted to see. This post is about what we added as well as how we made the changes under the hood to make them work.

## What we added to the OpenAPI specification

At the moment, we have two main tools, our [API reference](https://docs.scalar.com/) and [client](https://client.scalar.com/). Our extensions to the OpenAPI specification are to support the experience we want to provide with both of these tools. Specifically, they include:

### 1. Environments

Our API client has the concept of environments which enables you to define environment variables and configurations for use across your endpoints. Collections can have multiple different environments.

You can set up an environment manually in the API client or you can set them up in your OpenAPI doc with `x-scalar-environments` like this:

```
# ... rest of your OpenAPI doc

x-scalar-environments:
  production:
    description: 'Production environment'
    color: '#0082D0'
    variables:
      apiKey:
        description: 'Production API Key'
        default: 'prod-key-123'

  development:
    description: 'Development environment'
    color: '#7ED321'
    variables:
      apiKey:
        description: 'Development API Key'
        default: 'dev-key-456'
```

This creates a pre-filled environment in the Scalar API client anytime someone imports the OpenAPI doc. This makes environments reusable and much easier to set up.

[![Scalar environments](https://substackcdn.com/image/fetch/$s_!36lp!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa789657d-1f53-4a48-a122-a0345f246b03_1404x360.png "Scalar environments")](https://substackcdn.com/image/fetch/$s_!36lp!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa789657d-1f53-4a48-a122-a0345f246b03_1404x360.png)

On top of that, you can specify which environment should be the default with `x-scalar-active-environment`. If you don’t set this, we just use the first `x-scalar-environments` value.

```
# ... rest of your OpenAPI doc

x-scalar-active-environment: development
```

### 2. Code samples

Although we provide a bunch of code samples for everything from cURL to `http.client` to `clj-http`, there might be more code samples you want to add to your API reference. This is where `x-codeSamples` comes in.

Each of these contains a label, programming language, and source code.

```
# ... rest of your OpenAPI doc

paths:
  /upload:
    post:
      summary: Upload a file
      description: Uploads a file to the server with optional metadata
      x-codeSamples:
        - lang: Python
          label: Python SDK
          source: |
            import mycompany_sdk

            client = mycompany_sdk.Client("YOUR_API_KEY")

            # Upload file with metadata
            response = client.upload_file(
                file_path="example.pdf",
                metadata={"category": "documents"}
            )
            print(response.file_id)

      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                metadata:
                  type: object
                  properties:
                    category:
                      type: string
      responses:
        '200':
          description: File uploaded successfully
```

This then will show up as the sample for the operation in Scalar’s API reference.

[![](https://substackcdn.com/image/fetch/$s_!4c7x!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F73674e19-a903-456f-8920-5af5a5972465_1059x570.png)](https://substackcdn.com/image/fetch/$s_!4c7x!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F73674e19-a903-456f-8920-5af5a5972465_1059x570.png)

`x-codeSamples` are great for providing SDK examples, complex operations, language-specific features, and more.

### 3. Tags

Tags are used to group similar operations.

The trouble with tags is that they can have one use internally and a different usage externally. For example, you might have legacy, technical, or abbreviated tags internally, but want a different tag name to show externally.

To handle this, we added the `x-displayName` attribute. This overwrites the tag name in the OpenAPI doc with a new one users will see in the API reference. For example, to change the tag name `pets_v1` to `Pets`, you can do this:

```
tags:
  - name: pets_v1
    x-displayName: Pets # This will display as "Pets" instead of "pets_v1"
    description: Pet management operations
```

On top of this, larger OpenAPI docs often have a lot of unorganized tags and endpoints. We provide

```
x-tagGroups:
  - name: Store Management
    tags:
      - stores_v1
      - inventory_v1
  - name: Pet Operations
    tags:
      - pets_v1
  - name: Human Resources
    tags:
      - employees_v1
```

### 4. Internal

Because your OpenAPI doc might include endpoints you don’t want published, we can help hide them from the API reference and client using

```
/system/cache/clear:
  post:
    summary: Clear system cache
    description: Internal endpoint to clear the application cache
    x-internal: true
    responses:
      '200':
        description: Cache cleared successfully
```

### 5. Additional properties

Finally, a little quality of life improvement for additional properties. Although normal properties have known fixed names, additional properties do not. If you’d like to add a name, you can use

```
MetadataObject:
  type: object
  properties:
    createdAt:
      type: string
      format: date-time
  additionalProperties:
    x-additionalPropertiesName: metadataField
    type: object
    description: Dynamic metadata fields
```

## How we handle these under the hood

The work to handle this extended OpenAPI spec and make it actually do something in Scalar’s API client and reference requires schema validation, integration with our store, and UI implementation.

### 1. Schema validation

Each parameter or attribute is handled in a similar way under the hood. They all start with a schema defined using Zod validation. This ensures the OpenAPI doc matches the expected structure, fields are present and have correct types, and optional fields are handled correctly.

```
export const xScalarEnvironmentSchema = z.object({
  description: z.string().optional(),
  color: z.string().optional(),
  variables: z.record(z.string(), xScalarEnvVarSchema),
})
```

When we change the schema, we don’t want to break past versions of the schema. To prevent this, we set up and run some migrations. We store the version and types for that version and then the migrator helps change versions. For example, the migration to add `x-scalar-environments` looked like this:

```
export const migrate_v_2_3_0 = (data: v_2_2_0.DataRecord): v_2_3_0.DataRecord => {
  // Other migration logic...

  const collections = Object.values(data.collections).reduce
    v_2_3_0.DataRecord['collections']
  >((prev, c) => {
    prev[c.uid] = {
      ...c,
      'x-scalar-environments': c['x-scalar-environments'] || {},
    }
    return prev
  }, {})
  // ... rest of your code
```

### 2. State management

The schema then integrates with the relevant store and its associated mutators. For example, `x-scalar-environments` integrates with the store responsible for environment handling like this:

```
// Handles active state for environments and collections
export const createActiveEntitiesStore = ({
  collections,
  requestExamples,
  requests,
  router,
  workspaces,
}) => {
  // Environment handling
  const activeEnvironment = computed(() => {
    if (!activeWorkspace.value.activeEnvironmentId) {
      return {
        uid: '',
        name: 'No Environment',
        value: JSON.stringify(activeWorkspace.value.environments, null, 2),
      }
    }

    // Find environment in collections
    const activeEnvironmentCollection = activeWorkspaceCollections.value.find(
      (c) => c['x-scalar-environments']?.[activeWorkspace.value.activeEnvironmentId]
    )
    // ...
```

### 3. UI implementation

Finally, with the data validated and integrated with the stores, we can change the UI that users actually see. The only hang up here is that each extension ends up affecting a different part of Scalar: some only impact the API client, others only the API reference.

On top of this, the complexity varies dramatically:

* `x-displayName`, `x-tagGroup`, `x-internal`, `x-additionalPropertiesName` are all relatively straightforward conditional rendering.
* `x-codeSamples` integrates with the existing code sample code.
* The most complicated is `x-scalar-environments` which integrates with multiple different components including all of the ones necessary to create, select, and edit environments as well as variable substitution in requests and more.

In the end, most of what you see is small improvements to the overall experience of using OpenAPI docs with Scalar’s API client and reference. **This is the point.** We know these small improvements add up to create the best possible experience for API developers.

## Why extend the OpenAPI specification?

Extending the OpenAPI specification enables us to continue to use OpenAPI documents as the source of truth while providing improved developer experience, better configuration management, and improved organization. Expect to see more extensions from us in the future as we build out our tools to work with OpenAPI.

**Apr 6, 2025**
