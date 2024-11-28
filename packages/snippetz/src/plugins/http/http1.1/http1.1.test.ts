import { describe, expect, it } from 'vitest'

import { httpHttp11 } from './http1.1'

describe('httpHttp11', () => {
  it('returns a basic request', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
    })

    expect(result).toBe('GET / HTTP/1.1\r\n' + 'Host: example.com\r\n' + '\r\n')
  })

  it('returns a POST request', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(
      'POST / HTTP/1.1\r\n' + 'Host: example.com\r\n' + '\r\n',
    )
  })

  it('has headers', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe(
      'GET / HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        'Content-Type: application/json\r\n' +
        '\r\n',
    )
  })

  it.skip('handles multipart form data with files', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'test.txt',
          },
          {
            name: 'field',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"net/http"
	"io"
	"bytes"
	"mime/multipart"
)

func main() {

	url := "https://example.com"

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add file field
	writer.WriteField("file", "test.txt")
	// Add form field
	writer.WriteField("field", "value")
	writer.Close()

	req, _ := http.NewRequest("POST", url, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	responseBody, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(responseBody))
}`,
    )
  })

  it.skip('handles url-encoded form data with special characters', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'special chars!@#',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://example.com"

	req, _ := http.NewRequest("POST", url, nil)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles binary data', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"strings"
	"net/http"
	"io"
)

func main() {

	url := "https://example.com"

	payload := strings.NewReader("binary content")

	req, _ := http.NewRequest("POST", url, payload)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles special characters in URL', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://example.com/path with spaces/[brackets]"

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles multiple headers with same name', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://example.com"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("X-Custom", "value2")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles headers with empty values', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://example.com"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("X-Empty", "")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles query string parameters', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(
      'GET /api?param1=value1&param2=special value&param3=123 HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        '\r\n',
    )
  })
})
