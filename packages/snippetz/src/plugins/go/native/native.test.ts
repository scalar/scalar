import { describe, expect, it } from 'vitest'

import { goNative } from './native'

describe('goNative', () => {
  it('returns a basic request', () => {
    const result = goNative.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com"

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('returns a POST request', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com"

	req, _ := http.NewRequest("POST", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('has headers', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("Content-Type", "application/json")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles multipart form data with files', () => {
    const result = goNative.generate({
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
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
)

func main() {
	url := "https://example.com"

	payload := &bytes.Buffer{}
	writer := multipart.NewWriter(payload)

	part, _ := writer.CreateFormFile("file", "test.txt")

	f, _ := os.Open("test.txt")
	defer f.Close()

	_, _ = io.Copy(part, f)

	_ = writer.WriteField("field", "value")
	writer.Close()

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Set("Content-Type", writer.FormDataContentType())
	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles url-encoded form data with special characters', () => {
    const result = goNative.generate({
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
	"io"
	"net/http"
	"net/url"
	"strings"
)

func main() {
	url := "https://example.com"

	postData := url.Values{}
	postData.Set("special chars!@#", "value")

	req, _ := http.NewRequest("POST", url, strings.NewReader(postData.Encode()))

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles binary data', () => {
    const result = goNative.generate({
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
	"io"
	"net/http"
	"strings"
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
    const result = goNative.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com/path%20with%20spaces/[brackets]"

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
    const result = goNative.generate({
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
	"io"
	"net/http"
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
    const result = goNative.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
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
    const result = goNative.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com/api?param1=value1&param2=special%20value&param3=123"

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })
})
