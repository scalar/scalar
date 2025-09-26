# Scalar API Reference for ElysiaJS

The `@elysiajs/openapi` plugin uses our API Reference by default:

```ts
import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'

new Elysia()
    .use(openapi())
    .get('/', () => 'hello')
    .post('/hello', () => 'OpenAPI')
    .listen(3000)

// open http://localhost:3000/openapi
```

[Read more about @elysiajs/openapi](https://elysiajs.com/plugins/openapi)
