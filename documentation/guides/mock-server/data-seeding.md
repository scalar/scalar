# Data Seeding

The `x-seed` extension allows you to automatically populate initial data when the mock server starts. This is perfect for having realistic test data available immediately without manual setup.

## When to Use x-seed

Use `x-seed` when you need:
- **Initial test data** available on server startup
- **Realistic sample data** for development and testing
- **Consistent starting state** across server restarts
- **Quick prototyping** without manual data entry

## How It Works

1. **Automatic execution**: Seed code runs automatically when the server starts
2. **Idempotent**: Only seeds if the collection is empty (won't duplicate data on restart)
3. **Schema-based**: Each schema can have its own seed code
4. **Collection naming**: The schema key name is used as the collection name

## Seed Helper

The `seed` helper provides a Laravel-inspired API for creating data. It automatically uses the schema key as the collection name.

### `seed.count(n, factory)` - Create Multiple Items

Create `n` items using a factory function:

```yaml
components:
  schemas:
    Post:
      type: object
      properties:
        id: { type: string }
        title: { type: string }
        content: { type: string }
        author: { type: string }
        publishedAt: { type: string, format: date-time }
      x-seed: |
        seed.count(5, () => ({
          id: faker.string.uuid(),
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(3),
          author: faker.person.fullName(),
          publishedAt: faker.date.past().toISOString()
        }))
```

### `seed(array)` - Create from Array

Create items from an array of objects:

```yaml
components:
  schemas:
    Post:
      type: object
      x-seed: |
        seed([
          {
            id: '1',
            title: 'Getting Started with Scalar',
            content: 'Learn how to use Scalar...',
            author: 'Jane Doe'
          },
          {
            id: '2',
            title: 'Advanced API Documentation',
            content: 'Take your docs to the next level...',
            author: 'John Smith'
          }
        ])
```

### `seed(factory)` - Create Single Item

Create a single item using a factory function (shorthand for `seed.count(1, factory)`):

```yaml
components:
  schemas:
    Post:
      type: object
      x-seed: |
        seed(() => ({
          id: faker.string.uuid(),
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(2),
          author: faker.person.fullName(),
          publishedAt: new Date().toISOString()
        }))
```

## Available Context

When writing `x-seed` code, you have access to:

- **`store`**: The same store helper as `x-handler` (for advanced use cases)
- **`faker`**: Faker.js for generating realistic data
- **`seed`**: The seed helper function (described above)
- **`schema`**: The schema key name (useful for debugging)

## Example: Blog Posts with Seeding

Here's a complete example that combines `x-seed` for initial data and `x-handler` for endpoints:

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
          ...req.body,
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
      x-seed: |
        seed.count(10, () => ({
          id: faker.string.uuid(),
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(4),
          author: faker.person.fullName(),
          publishedAt: faker.date.past().toISOString(),
          createdAt: faker.date.past().toISOString()
        }))
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
```

When the server starts, it will automatically create 10 blog posts. You can immediately call `GET /posts` to see them.

## Multiple Schemas

You can seed multiple collections by adding `x-seed` to multiple schemas:

```yaml
components:
  schemas:
    Post:
      type: object
      x-seed: |
        seed.count(5, () => ({
          id: faker.string.uuid(),
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(3)
        }))

    Author:
      type: object
      x-seed: |
        seed.count(3, () => ({
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          bio: faker.person.bio()
        }))

    Category:
      type: object
      x-seed: |
        seed([
          { id: '1', name: 'Technology' },
          { id: '2', name: 'Design' },
          { id: '3', name: 'Business' }
        ])
```

Each schema seeds independently, and all collections are populated when the server starts.

## Idempotent Behavior

The seed code only runs if the collection is empty. This means:

- **First start**: Seeds the data
- **Subsequent starts**: Skips seeding if data exists
- **After clearing**: Seeds again on next start

This prevents duplicate data and ensures consistent behavior. If you need to reseed, you can clear the collection using `store.clear('Post')` in an `x-handler` endpoint, or restart the server after clearing.

## Best Practices

1. **Use meaningful counts**: Seed enough data to be useful but not overwhelming (5-20 items is usually good)
2. **Generate realistic data**: Use Faker to create believable test data
3. **Match schema structure**: Ensure seeded data matches your schema properties
4. **Use factories**: Prefer factory functions over hardcoded arrays for flexibility
5. **Combine with x-handler**: Use `x-seed` for initial data and `x-handler` for CRUD operations

## Common Patterns

### Seeding with Relationships

```yaml
Post:
  type: object
  x-seed: |
    // First create authors
    const authors = seed.count(3, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName()
    }))

    // Then create posts with author references
    seed.count(10, () => ({
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      authorId: faker.helpers.arrayElement(authors).id
    }))
```

### Seeding with Varied Data

```yaml
Post:
  type: object
  x-seed: |
    seed.count(10, () => {
      const isPublished = faker.datatype.boolean()
      return {
        id: faker.string.uuid(),
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3),
        published: isPublished,
        publishedAt: isPublished ? faker.date.past().toISOString() : null
      }
    })
```

