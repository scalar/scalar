import type {
  Request,
  RequestExample,
  RequestExampleParameter,
  ResponseInstance,
} from '@scalar/oas-utils/entities/workspace/spec'
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

/**
 * Convert the parameters array to an object for axios to consume
 */
const paramsReducer = (params: RequestExampleParameter[] = []) =>
  params.reduce(
    (acc, param) => {
      if (!param.key) return acc
      acc[param.key] = param.value
      return acc
    },
    {} as Record<string, string>,
  )

/** Skip the proxy for requests to localhost */
const isRequestToLocalhost = (url: string) => {
  const { hostname } = new URL(url)
  const listOfLocalUrls = ['localhost', '127.0.0.1', '[::1]']
  return listOfLocalUrls.includes(hostname)
}

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
export const sendRequest = async (
  request: Request,
  example: RequestExample,
  rawUrl: string,
) => {
  let url = rawUrl

  // Replace path params
  example.parameters.path.forEach((pathParam) => {
    if (pathParam.key && pathParam.value) {
      url = url.replace(`:${pathParam.key}`, pathParam.value)
    }
  })

  // Decide whether to use a proxy or not
  const shouldUseProxy = !isRequestToLocalhost(url)

  const headers = paramsReducer(example.parameters.headers)

  let data: FormData | string | File | null = null

  if (example.body.activeBody === 'binary' && example.body.binary) {
    headers['Content-Type'] = example.body.binary.type
    headers['Content-Disposition'] =
      `attachment; filename="${example.body.binary.name}"`
    data = example.body.binary
  } else if (example.body.activeBody === 'raw') {
    data = example.body.raw.value
  } else if (example.body.activeBody === 'formData') {
    headers['Content-Type'] = 'multipart/form-data'

    const bodyFormData = new FormData()
    if (example.body.formData.encoding === 'form-data') {
      example.body.formData.value.forEach((formParam) => {
        if (formParam.key && formParam.value) {
          bodyFormData.append(formParam.key, formParam.value)
        } else if (formParam.file) {
          bodyFormData.append(formParam.file.name, formParam.file)
        }
      })
      data = bodyFormData
    }
  }

  // Add cookies to the headers
  if (example.parameters.cookies) {
    const cookies = paramsReducer(
      (example.parameters.cookies ?? []).filter((cookie) => cookie.enabled),
    )

    headers.Cookie = Object.keys(cookies)
      .map((key) => `${key}=${cookies[key]}`)
      .join('; ')
  }

  const config: AxiosRequestConfig = {
    url: shouldUseProxy
      ? `http://localhost:5051/?scalar_url=${encodeURI(url)}`
      : url,
    method: request.method,
    headers,
    params: paramsReducer(example.parameters.query),
    data,
  }

  const response = await axios(config).catch((error: AxiosError) => {
    // TODO handle error
    console.error(error)
    return error.response
  })

  if (response) {
    if (shouldUseProxy) {
      // Remove headers, that are added by the proxy
      const headersToRemove = [
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Expose-Headers',
      ]

      headersToRemove
        .map((header) => header.toLowerCase())
        .forEach((header) => delete response.headers[header])
    }

    return {
      request: example,
      response: response,
    }
  } else {
    return {}
  }
}
