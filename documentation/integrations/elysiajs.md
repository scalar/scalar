# Scalar API Reference for ElysiaJS

The `@elysiajs/swagger` plugin uses our API reference by default:

```ts
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'

new Elysia()
  .use(swagger())
  .get('/', () => 'hi')
  .post('/hello', () => 'world')
  .listen(8080)

// open http://localhost:8080/swagger
```

[Read more about @elysiajs/swagger](https://elysiajs.com/plugins/swagger.html)
