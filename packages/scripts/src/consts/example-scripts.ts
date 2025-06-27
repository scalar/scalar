export type ExampleScript = {
  title: string
  script: string
  mockResponse: {
    body?: any
    status?: number
    headers?: Record<string, string>
    text?: () => string
  }
}

export const EXAMPLE_SCRIPTS: ExampleScript[] = [
  {
    title: 'Check the status code',
    script: `pm.test("Status code is 200", () => {
  pm.response.to.have.status(200)
})`,
    mockResponse: {
      status: 200,
      body: { success: true },
    },
  },
  // TODO: We didn't add the proper response duration yet.
  //   {
  //     title: 'Check response time',
  //     script: `pm.test("Response time is acceptable", () => {
  //   pm.expect(pm.response.responseTime).to.be.below(200)
  // })`,
  //     mockResponse: {
  //       status: 200,
  //       body: { success: true },
  //     },
  //   },
  {
    title: 'Check JSON response',
    script: `pm.test("Response is valid JSON", () => {
  const responseData = pm.response.json()
  pm.expect(responseData).to.be.an('object')
})`,
    mockResponse: {
      status: 200,
      body: { data: 'test' },
      headers: { 'Content-Type': 'application/json' },
    },
  },
  {
    title: 'Check response headers',
    script: `pm.test("Content-Type header is present", () => {
  pm.response.to.have.header('Content-Type')
})`,
    mockResponse: {
      status: 200,
      body: { success: true },
      headers: { 'Content-Type': 'application/json' },
    },
  },
  {
    title: 'Validate JSON schema',
    script: `pm.test("Response matches schema", () => {
  const schema = {
    required: ['id', 'name'],
    properties: {
      id: { type: 'number' },
      name: { type: 'string' }
    }
  }
  pm.response.to.have.jsonSchema(schema)
})`,
    mockResponse: {
      status: 200,
      body: { id: 1, name: 'Test Item' },
      headers: { 'Content-Type': 'application/json' },
    },
  },
  {
    title: 'Check response body',
    script: `pm.test("Response body contains string", () => {
  pm.expect(pm.response.text()).to.include('success')
})`,
    mockResponse: {
      status: 200,
      body: 'This is a successful response',
    },
  },
  {
    title: 'Successful POST request',
    script: `pm.test("Successful POST request", () => {
  pm.expect(pm.response.code).to.be.oneOf([201, 202])
})`,
    mockResponse: {
      status: 201,
      body: { success: true },
    },
  },
]
