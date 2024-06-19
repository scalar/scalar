# Scalar API Reference for Next.js

Next.js enables you to create high-quality web applications with the power of React components. And Scalar enables you to create high-quality API references. What a match, isn’t it?

## Create a new Next.js project (optional)

Sometimes, it’s great to start on a blank slate and set up a new project:

```bash
npx create-next-app@latest my-awesome-app
```

You’ll get some questions, you can leave all the default answers – or pick what you prefer:

```bash
? Would you like to use TypeScript? › No
? Would you like to use ESLint? › No
? Would you like to use Tailwind CSS? … No
? Would you like to use `src/` directory? › No
? Would you like to use App Router? (recommended) › Yes
? Would you like to customize the default import alias (@/*)? … No
```

That should be it. Jump into the folder and start the development server:

```bash
cd my-awesome-app
npm run dev
```

Great! Open <http://localhost:3000> and see the default Next.js homepage. :)

## Render your OpenAPI reference with Scalar

Ready to add your API reference? Cool, there are a few options to integrate your API reference. The recommended way is to use our Next.js integration for app routing:

### Recommended: App router

Install the package:

```bash
npm add @scalar/nextjs-api-reference
```

… and add a new app route:

```js
// app/reference/route.js
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  spec: {
    content: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  },
}

export const GET = ApiReference(config)
```

Open <http://localhost:3000/reference> and there it is: Your new API reference. :)

### Alternative: Pages router

But you can also just use our React integration and add a page route:

```bash
npm add @scalar/api-reference-react
```

… and aa a new page route:

```js
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

export default function References() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
        },
      }}
    />
  )
}
```
