import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'

const accessToken = '1234567890'
const posts = [
  {
    userId: 1,
    id: 1,
    title: 'first post title',
    body: 'first post body',
  },
  // ...
]

const handleAuth = (request: Request) => {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${accessToken}`) {
    return new HttpResponse('Unauthorized', {
      status: 404,
    })
  }
}

export const restHandlers = [
  http.get('https://rest-endpoint.example/posts', () => {
    return HttpResponse.json(posts)
  }),
  http.post('https://rest-endpoint.example/posts', async ({ request }) => {
    const errorResponse = handleAuth(request)
    if (errorResponse) {
      return errorResponse
    }

    return HttpResponse.json(posts)
  }),
  http.get('https://rest-endpoint.example/object-fetch', async ({ request }) => {
    const errorResponse = handleAuth(request)
    if (errorResponse) {
      return errorResponse
    }

    const url = new URL(request.url)
    // Read the "id" URL query parameter using the "URLSearchParams" API.
    // Given "/product?id=1", "productId" will equal "1".
    const postId = url.searchParams.get('id')

    const response = posts.find((post) => post.id === Number(postId))
    if (!response) {
      return HttpResponse.json({ error: 'Not found' })
    }
    return new HttpResponse(response.title, { status: 200 })
  }),
  http.get('https://rest-endpoint.example/object-fetch/:id', async ({ request, params }) => {
    const errorResponse = handleAuth(request)
    if (errorResponse) {
      return errorResponse
    }

    const response = posts.find((post) => post.id === Number(params.id))
    if (!response) {
      return HttpResponse.json({ error: 'Not found' })
    }
    return HttpResponse.json(response)
  }),
  http.post('https://rest-endpoint.example/object-fetch', async ({ request }) => {
    const errorResponse = handleAuth(request)
    if (errorResponse) {
      return errorResponse
    }

    const data = await request.json()
    if (!data || typeof data !== 'object' || !('title' in data)) {
      return new HttpResponse('Invalid request body', {
        status: 400,
      })
    }

    console.log(data)
    const response = posts.find((post) => post.title === data.title)
    console.log(response)
    return HttpResponse.json(response)
  }),
]

const server = setupServer(...restHandlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

//  Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())
