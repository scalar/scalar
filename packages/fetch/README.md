# Scalar Fetch

A lightweight, fetch-based wrapper over an HTTP client that returns standardized and typesafe response formats.

Define your response data schema using zod.

## Installation

```bash
npm install @scalar/fetch
```

## Usage

### Validate your return data

```ts
const result = await request({
  disableAuth: true,
  url: 'https://galaxy.scalar.com/planets/1',
  method: 'get',
  schema: z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    image: z.string(),
    creator: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().z.email(),
    }),
  }),
})
```

### Define your request body data

```ts
const result = await request({
  disableAuth: true,
  baseUrl: 'https://galaxy.scalar.com',
  url: '/user/signup',
  method: 'post',
  data: {
    name: 'Marc',
    email: 'marc@scalar.com',
    passowrd: 'i-love-scalar',
  },
  schema: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().z.email(),
  }),
})
```

### Make an authenticated request

```ts
const result = await request({
  accessToken: 'MY_SECRET_TOKEN',
  baseUrl: 'https://galaxy.scalar.com',
  url: '/me',
  method: 'get',
  schema: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().z.email(),
  }),
})
```

### Pass your accessToken as a getAccessToken function

```ts
const result = await request({
  accessToken: () => 'MY_SECRET_TOKEN',
  baseUrl: 'https://galaxy.scalar.com',
  url: '/me',
  method: 'get',
  schema: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().z.email(),
  }),
})
```

## Return Types

Successful requests will have the following shape and your data will have the type you defined in the schema

```ts
export type APIResponse<T> = {
  status: number
  data: T
  error: false
}
```

And errors will look like

```ts
export type APIError = {
  status: number
  message: string
  error: true
  originalError: any
}
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
