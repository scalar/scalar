import { CodeBuilder } from '@/httpsnippet-lite/helpers/code-builder'
import { escapeForDoubleQuotes } from '@/httpsnippet-lite/helpers/escape'
import type { Client } from '@/httpsnippet-lite/targets/target'
import { createSearchParams } from '@/libs/http'

export const libcurl: Client = {
  info: {
    key: 'libcurl',
    title: 'Libcurl',
    link: 'http://curl.haxx.se/libcurl',
    description: 'Simple REST and HTTP API Client for C',
  },
  convert: ({ method, fullUrl, headersObj, allHeaders, postData }) => {
    const { push, blank, join } = new CodeBuilder({ indent: '  ' })
    push('CURL *hnd = curl_easy_init();')
    blank()
    push(`curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "${method.toUpperCase()}");`)
    push(`curl_easy_setopt(hnd, CURLOPT_URL, "${fullUrl}");`)
    // Add headers, including the cookies
    const headers = Object.keys(headersObj)
    // construct headers
    if (headers.length) {
      blank()
      push('struct curl_slist *headers = NULL;')
      headers.forEach((header) => {
        // See https://curl.se/libcurl/c/httpcustomheader.html for syntax
        if (headersObj[header]) {
          push(
            `headers = curl_slist_append(headers, "${header}: ${escapeForDoubleQuotes(headersObj[header] as string)}");`,
          )
        } else {
          push(`headers = curl_slist_append(headers, "${header};");`)
        }
      })
      push('curl_easy_setopt(hnd, CURLOPT_HTTPHEADER, headers);')
    }
    // construct cookies
    if (allHeaders.cookie) {
      blank()
      push(`curl_easy_setopt(hnd, CURLOPT_COOKIE, "${allHeaders.cookie}");`)
    }
    if (postData !== null && postData !== void 0) {
      blank()
      if (postData.text) {
        push(`curl_easy_setopt(hnd, CURLOPT_POSTFIELDS, ${JSON.stringify(postData.text)});`)
      } else if (postData.mimeType === 'application/x-www-form-urlencoded' && postData.params) {
        push(`curl_easy_setopt(hnd, CURLOPT_POSTFIELDS, "${createSearchParams(postData.params as never).toString()}");`)
      } else if (postData.mimeType === 'multipart/form-data' && postData.params) {
        push('curl_mime *mime = curl_mime_init(hnd);')
        postData.params.forEach((param) => {
          blank()
          push('{')
          push('curl_mimepart *part = curl_mime_addpart(mime);', 1)
          if (param.name) {
            push(`curl_mime_name(part, "${param.name}");`, 1)
          }
          if (param.fileName) {
            push(`curl_mime_filedata(part, "${param.fileName}");`, 1)
          } else if (param.value) {
            push(`curl_mime_data(part, "${escapeForDoubleQuotes(param.value)}", CURL_ZERO_TERMINATED);`, 1)
          }
          push('}')
        })
        blank()
        push('curl_easy_setopt(hnd, CURLOPT_MIMEPOST, mime);')
      }
    }
    blank()
    push('CURLcode ret = curl_easy_perform(hnd);')
    return join()
  },
}
