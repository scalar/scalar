// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for PHP using curl-ext.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForDoubleQuotes } from '../../../helpers/escape.js'
import { convertType } from '../helpers.js'

export const curl = {
  info: {
    key: 'curl',
    title: 'cURL',
    link: 'http://php.net/manual/en/book.curl.php',
    description: 'PHP with ext-curl',
  },
  convert: (
    { uriObj, postData, fullUrl, method, httpVersion, cookies, headersObj },
    options = {},
  ) => {
    const {
      closingTag = false,
      indent = '  ',
      maxRedirects = 10,
      namedErrors = false,
      noTags = false,
      shortTags = false,
      timeout = 30,
    } = options
    const { push, blank, join } = new CodeBuilder({ indent })
    if (!noTags) {
      push(shortTags ? '<?' : '<?php')
      blank()
    }
    push('$curl = curl_init();')
    blank()
    const curlOptions = [
      {
        escape: true,
        name: 'CURLOPT_PORT',
        value: uriObj.port === '' ? null : uriObj.port,
      },
      {
        escape: true,
        name: 'CURLOPT_URL',
        value: fullUrl,
      },
      {
        escape: false,
        name: 'CURLOPT_RETURNTRANSFER',
        value: 'true',
      },
      {
        escape: true,
        name: 'CURLOPT_ENCODING',
        value: '',
      },
      {
        escape: false,
        name: 'CURLOPT_MAXREDIRS',
        value: maxRedirects,
      },
      {
        escape: false,
        name: 'CURLOPT_TIMEOUT',
        value: timeout,
      },
      {
        escape: false,
        name: 'CURLOPT_HTTP_VERSION',
        value:
          httpVersion === 'HTTP/1.0'
            ? 'CURL_HTTP_VERSION_1_0'
            : 'CURL_HTTP_VERSION_1_1',
      },
      {
        escape: true,
        name: 'CURLOPT_CUSTOMREQUEST',
        value: method,
      },
      {
        escape: !(postData === null || postData === void 0
          ? void 0
          : postData.jsonObj),
        name: 'CURLOPT_POSTFIELDS',
        value: postData
          ? postData.jsonObj
            ? `json_encode(${convertType(postData.jsonObj, indent.repeat(2), indent)})`
            : postData.text
          : undefined,
      },
    ]
    push('curl_setopt_array($curl, [')
    const curlopts = new CodeBuilder({ indent, join: `\n${indent}` })
    curlOptions.forEach(({ value, name, escape }) => {
      if (value !== null && value !== undefined) {
        curlopts.push(`${name} => ${escape ? JSON.stringify(value) : value},`)
      }
    })
    // construct cookies
    const curlCookies = cookies.map(
      (cookie) =>
        `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`,
    )
    if (curlCookies.length) {
      curlopts.push(`CURLOPT_COOKIE => "${curlCookies.join('; ')}",`)
    }
    // construct cookies
    const headers = Object.keys(headersObj)
      .sort()
      .map((key) => `"${key}: ${escapeForDoubleQuotes(headersObj[key])}"`)
    if (headers.length) {
      curlopts.push('CURLOPT_HTTPHEADER => [')
      curlopts.push(headers.join(`,\n${indent}${indent}`), 1)
      curlopts.push('],')
    }
    push(curlopts.join(), 1)
    push(']);')
    blank()
    push('$response = curl_exec($curl);')
    push('$err = curl_error($curl);')
    blank()
    push('curl_close($curl);')
    blank()
    push('if ($err) {')
    if (namedErrors) {
      push('echo array_flip(get_defined_constants(true)["curl"])[$err];', 1)
    } else {
      push('echo "cURL Error #:" . $err;', 1)
    }
    push('} else {')
    push('echo $response;', 1)
    push('}')
    if (!noTags && closingTag) {
      blank()
      push('?>')
    }
    return join()
  },
}
