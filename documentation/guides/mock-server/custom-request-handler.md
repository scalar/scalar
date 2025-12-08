# Custom Request Handlers

The `x-handler` extension allows you to write custom JavaScript code directly in your OpenAPI operations to handle requests dynamically. This gives you full control over request processing, data persistence, and response generation.

## When to Use x-handler

Use `x-handler` when you need:
- **Persistent data** across requests (CRUD operations)
- **Dynamic responses** based on request data
- **Custom business logic** in your mock server
- **Realistic data generation** using Faker

Without `x-handler`, the mock server returns static example data. With `x-handler`, you can build fully functional mock APIs that behave like real backends.

## Available Helpers

When writing `x-handler` code, you have access to several helpers:

### `store` - Data Persistence

The `store` helper provides an in-memory database for your mock data. Data persists during the server lifetime but resets on restart.

```javascript
// List all items in a collection
store.list('Post')

// Get a single item by ID
store.get('Post', 'post-id-123')

// Create a new item (auto-generates ID if not provided)
store.create('Post', { title: 'My Post', content: '...' })

// Update an existing item
store.update('Post', 'post-id-123', { title: 'Updated Title' })

// Delete an item
store.delete('Post', 'post-id-123')

// Clear a collection or all data
store.clear('Post')  // Clear specific collection
store.clear()        // Clear all collections
```

### `faker` - Data Generation

The `faker` helper provides access to [Faker.js](https://fakerjs.dev/) for generating realistic fake data.

```javascript
faker.string.uuid()           // Generate UUIDs
faker.lorem.sentence()         // Generate sentences
faker.lorem.paragraphs(3)     // Generate paragraphs
faker.person.fullName()       // Generate names
faker.date.past()             // Generate dates
faker.internet.email()        // Generate emails
// ... and many more
```

### `req` - Request Object

Access request data through the `req` object:

```javascript
req.body      // Parsed request body (JSON, form data, etc.)
req.params    // Path parameters (e.g., { id: '123' })
req.query     // Query string parameters (e.g., { page: '1' })
req.headers   // Request headers
```

### `res` - Response Examples

The `res` object contains example responses for each status code defined in your OpenAPI spec:

```javascript
res['200']  // Example for 200 status
res['201']  // Example for 201 status
res['404']  // Example for 404 status
```

## Example: Blog Posts API

Here's a complete example of a blog posts API using `x-handler`:

```yaml
openapi: 3.1.0
info:
  title: Blog API
  version: 1.0.0
paths:
  /posts:
    get:
      summary: List all posts
      operationId: listPosts
      x-handler: |
        return store.list('Post')
      responses:
        '200':
          description: List of posts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Post'

    post:
      summary: Create a new post
      operationId: createPost
      x-handler: |
        return store.create('Post', {
          id: faker.string.uuid(),
          title: req.body.title,
          content: req.body.content,
          author: req.body.author || faker.person.fullName(),
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        })
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewPost'
      responses:
        '201':
          description: Post created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'

  /posts/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      summary: Get a post by ID
      operationId: getPost
      x-handler: |
        return store.get('Post', req.params.id)
      responses:
        '200':
          description: Post found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          description: Post not found

    put:
      summary: Update a post
      operationId: updatePost
      x-handler: |
        return store.update('Post', req.params.id, {
          ...req.body,
          updatedAt: new Date().toISOString()
        })
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdatePost'
      responses:
        '200':
          description: Post updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          description: Post not found

    delete:
      summary: Delete a post
      operationId: deletePost
      x-handler: |
        return store.delete('Post', req.params.id)
      responses:
        '204':
          description: Post deleted
        '404':
          description: Post not found

components:
  schemas:
    Post:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        content:
          type: string
        author:
          type: string
        publishedAt:
          type: string
          format: date-time
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    NewPost:
      type: object
      required:
        - title
        - content
      properties:
        title:
          type: string
        content:
          type: string
        author:
          type: string
    UpdatePost:
      type: object
      properties:
        title:
          type: string
        content:
          type: string
```

## Automatic Status Code Determination

The mock server automatically determines HTTP status codes based on the store operation used:

- **`store.get()`**: Returns `200` if item found, `404` if `null` or `undefined`
- **`store.create()`**: Always returns `201` (Created)
- **`store.update()`**: Returns `200` if item found, `404` if `null` or `undefined`
- **`store.delete()`**: Returns `204` (No Content) if deleted, `404` if not found
- **`store.list()`**: Always returns `200`

## Custom Responses

You can return any value from your handler. The mock server will serialize it as JSON:

```yaml
x-handler: |
  const posts = store.list('Post')
  return {
    data: posts,
    total: posts.length,
    page: parseInt(req.query.page || '1'),
    perPage: 10
  }
```

## Error Handling

If your handler throws an error, the server returns a `500` status with an error message:

```yaml
x-handler: |
  if (!req.body.title) {
    throw new Error('Title is required')
  }
  return store.create('Post', req.body)
```

The error response will be:

```json
{
  "error": "Handler execution failed",
  "message": "Title is required"
}
```

## Best Practices

1. Use meaningful collection names: Match your schema names (e.g., `'Post'` for a `Post` schema)
2. Generate IDs: Use `faker.string.uuid()` for consistent ID generation
3. Handle missing data: Check for `null` or `undefined` when using `store.get()`
4. Use Faker for realistic data: Generate realistic test data instead of hardcoding values

