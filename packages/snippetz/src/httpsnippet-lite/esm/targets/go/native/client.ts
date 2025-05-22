// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for native Go.
 *
 * @author
 * @montanaflynn
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForDoubleQuotes } from '../../../helpers/escape.js'

export const native = {
  info: {
    key: 'native',
    title: 'NewRequest',
    link: 'http://golang.org/pkg/net/http/#NewRequest',
    description: 'Golang HTTP client request',
  },
  convert: ({ postData, method, allHeaders, fullUrl }, options = {}) => {
    const { blank, push, join, addPostProcessor } = new CodeBuilder({ indent: '\t' })
    const {
      showBoilerplate = true,
      checkErrors = false,
      printBody = true,
      timeout = -1,
      insecureSkipVerify = false,
    } = options
    const errorPlaceholder = checkErrors ? 'err' : '_'
    const indent = showBoilerplate ? 1 : 0
    const errorCheck = () => {
      if (checkErrors) {
        push('if err != nil {', indent)
        push('panic(err)', indent + 1)
        push('}', indent)
      }
    }
    // Create boilerplate
    const imports = new Set()
    if (showBoilerplate) {
      push('package main')
      blank()

      push('import ()')
      addPostProcessor((code) => {
        const importArray = [...imports]
        importArray.sort()
        const importBlock = importArray.map((line) => `\t"${line}"`).join('\n')
        return code.replace(/import \(\)/, `import (\n${importBlock}\n)`)
      })

      imports.add('fmt')
      imports.add('net/http')

      blank()
      push('func main() {')
    }
    // Create an insecure transport for the client
    if (insecureSkipVerify) {
      imports.add('crypto/tls')
      push(
        'insecureTransport := http.DefaultTransport.(*http.Transport).Clone()',
        indent,
      )
      push(
        'insecureTransport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}',
        indent,
      )
    }
    // Create client
    const hasTimeout = timeout > 0
    const hasClient = hasTimeout || insecureSkipVerify
    const client = hasClient ? 'client' : 'http.DefaultClient'
    if (hasClient) {
      push('client := http.Client{', indent)
      if (hasTimeout) {
        imports.add('time')
        push(`Timeout: time.Duration(${timeout} * time.Second),`, indent + 1)
      }
      if (insecureSkipVerify) {
        push('Transport: insecureTransport,', indent + 1)
      }
      push('}', indent)
      blank()
    }
    push(`url := "${fullUrl}"`, indent)
    blank()
    // If we have body content or not create the var and reader or nil
    if (postData !== null && postData !== void 0 && (postData.params || postData.text)) {
      if (postData.mimeType === 'application/x-www-form-urlencoded' && postData.params) {
        imports.add('net/url')
        imports.add('strings')

        push('postData := url.Values{}', indent)
        postData.params.forEach((param) => {
          push(
            `postData.Set("${param.name}", "${escapeForDoubleQuotes(param.value)}")`,
            indent,
          )
        })
        blank()
        push(
          `req, ${errorPlaceholder} := http.NewRequest("${method}", url, strings.NewReader(postData.Encode()))`,
          indent,
        )
      } else if (postData.mimeType === 'multipart/form-data' && postData.params) {
        imports.add('bytes')
        imports.add('mime/multipart')

        push('payload := &bytes.Buffer{}', indent)
        push('writer := multipart.NewWriter(payload)', indent)
        postData.params.forEach((param) => {
          blank()
          if (param.fileName) {
            push(`part, ${errorPlaceholder} := writer.CreateFormFile("${param.name}", "${param.fileName}")`, indent)
            errorCheck()
            blank()
            push(`f, ${errorPlaceholder} := os.Open("${param.fileName}")`, indent)
            errorCheck()
            push('defer f.Close()', indent)
            blank()
            push(`_, ${errorPlaceholder} = io.Copy(part, f)`, indent)
            errorCheck()
          } else {
            push(`${errorPlaceholder} = writer.WriteField("${param.name}", "${escapeForDoubleQuotes(param.value)}")`, indent)
            errorCheck()
          }
        })
        push('writer.Close()', indent)
        blank()
        push(
          `req, ${errorPlaceholder} := http.NewRequest("${method}", url, payload)`,
          indent,
        )
      } else {
        imports.add('strings')

        push(
          `payload := strings.NewReader(${JSON.stringify(postData.text)})`,
          indent,
        )
        blank()
        push(
          `req, ${errorPlaceholder} := http.NewRequest("${method}", url, payload)`,
          indent,
        )
      }
    } else {
      push(
        `req, ${errorPlaceholder} := http.NewRequest("${method}", url, nil)`,
        indent,
      )
    }
    errorCheck()
    blank()
    // Add headers
    if (postData !== null && postData !== void 0 && postData.mimeType === 'multipart/form-data' && postData.params) {
      push(`req.Header.Set("Content-Type", writer.FormDataContentType())`, indent)
    }
    if (Object.keys(allHeaders).length) {
      Object.keys(allHeaders).forEach((key) => {
        push(
          `req.Header.Add("${key}", "${escapeForDoubleQuotes(allHeaders[key])}")`,
          indent,
        )
      })
      blank()
    }
    // Make request
    push(`res, ${errorPlaceholder} := ${client}.Do(req)`, indent)
    errorCheck()
    // Get Body
    if (printBody) {
      imports.add('io')
      blank()
      push('defer res.Body.Close()', indent)
      push(`body, ${errorPlaceholder} := io.ReadAll(res.Body)`, indent)
      errorCheck()
    }
    // Print it
    blank()
    push('fmt.Println(res)', indent)
    if (printBody) {
      push('fmt.Println(string(body))', indent)
    }
    // End main block
    if (showBoilerplate) {
      blank()
      push('}')
    }
    return join()
  },
}
