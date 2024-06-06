import type {
  RequestInstance,
  RequestInstanceParameter,
  RequestRef,
  ResponseInstance,
} from '@scalar/oas-utils/entities/workspace/spec'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import axios from 'axios'

/**
 * Convert the parameters array to an object for axios to consume
 */
const paramsReducer = (params: RequestInstanceParameter[] = []) =>
  params.reduce(
    (acc, param) => {
      if (!param.key) return acc
      acc[param.key] = param.value
      return acc
    },
    {} as Record<string, string>,
  )

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
export const sendRequest = async (
  request: RequestRef,
  instance: RequestInstance,
) => {
  // Replace path params
  let url = instance.url
  instance.parameters.path.forEach((pathParam) => {
    if (pathParam.key && pathParam.value) {
      url = url.replace(`:${pathParam.key}`, pathParam.value)
    }
  })

  let data: FormData | string | File | null = null

  if (instance.body.activeBody === 'binary' && instance.body.binary) {
    const bodyFormData = new FormData()
    bodyFormData.append(instance.body.binary.name, instance.body.binary)
  } else if (instance.body.activeBody === 'raw') {
    data = instance.body.raw.value
  } else if (instance.body.activeBody === 'formData') {
    const bodyFormData = new FormData()
    if (instance.body.formData.encoding === 'form-data') {
      instance.body.formData.value.forEach((formParam) => {
        if (formParam.key && formParam.value) {
          bodyFormData.append(formParam.key, formParam.value)
        } else if (formParam.key && formParam.binary) {
          bodyFormData.append(formParam.binary.name, formParam.binary)
        }
      })
    }
    data = bodyFormData
  }

  const headers = paramsReducer(instance.parameters.headers)

  // Add cookies to the headers
  if (instance.parameters.cookies) {
    const cookies = paramsReducer(
      (instance.parameters.cookies ?? []).filter((cookie) => cookie.enabled),
    )

    headers.Cookie = Object.keys(cookies)
      .map((key) => `${key}=${cookies[key]}`)
      .join('; ')
  }

  const config: AxiosRequestConfig = {
    url: `https://proxy.scalar.com?scalar_url=${url}`,
    method: request.method,
    headers,
    params: paramsReducer(instance.parameters.query),
    data,
  }

  const response = (await axios(config).catch((error: AxiosError) => {
    // TODO handle error
    console.error(error)
    return {
      request: instance!,
      response: error.response!,
    }
  })) as ResponseInstance

  if (response) {
    return {
      request: instance,
      response: response,
    }
  } else {
    return {}
  }
}
