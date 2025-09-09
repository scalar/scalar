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

  it(`doesn't add empty headers`, () => {
    const result = goNative.generate({
      url: 'https://example.com',
      headers: [],
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

  it('has JSON body', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toBe(
      `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Request struct {
	Hello string \`json:"hello"\`
}

func main() {
	url := "https://example.com"

	payload := Request
	payload = Request{
	Hello: "world",
}
	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))

	req.Header.Set("Content-Type", "application/json")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('has query string', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
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
	url := "https://example.com/?foo=bar&bar=foo"

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('has cookies', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
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

	req.Header.Add("Cookie", "foo=bar; bar=foo")
	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it(`doesn't add empty cookies`, () => {
    const result = goNative.generate({
      url: 'https://example.com',
      cookies: [],
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

  it('adds basic auth credentials', () => {
    const result = goNative.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user',
          password: 'pass',
        },
      },
    )

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

	req.SetBasicAuth("user", "pass")
	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('omits auth when not provided', () => {
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

  it('omits auth when username is missing', () => {
    const result = goNative.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: '',
          password: 'pass',
        },
      },
    )

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

  it('omits auth when password is missing', () => {
    const result = goNative.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user',
          password: '',
        },
      },
    )

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

  it('handles special characters in auth credentials', () => {
    const result = goNative.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user@example.com',
          password: 'pass:word!',
        },
      },
    )

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

	req.SetBasicAuth("user@example.com", "pass:word!")
	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles undefined auth object', () => {
    const result = goNative.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

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

  it('handles multipart form data with JSON payload', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'multipart/form-data',
        },
      ],
      postData: {
        mimeType: 'multipart/form-data',
        text: JSON.stringify({
          foo: 'bar',
        }),
      },
    })

    expect(result).toBe(
      `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com"

	payload := bytes.NewBuffer([]byte(\`{
  "foo": "bar"
}\`))

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Set("Content-Type", "multipart/form-data")
	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles compressed response', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
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

	req.Header.Add("Accept-Encoding", "gzip, deflate")
	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles special characters in query parameters', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'q',
          value: 'hello world & more',
        },
        {
          name: 'special',
          value: '!@#$%^&*()',
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
	url := "https://example.com?q=hello%20world%20%26%20more&special=%21%40%23%24%25%5E%26*%28%29"

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles empty URL', () => {
    const result = goNative.generate({
      url: '',
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := ""

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles extremely long URLs', () => {
    const result = goNative.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com/${'a'.repeat(2000)}"

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles multipart form data with empty file names', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: '',
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

	part, _ := writer.CreateFormFile("file", "")

	f, _ := os.Open("")
	defer f.Close()

	_, _ = io.Copy(part, f)

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

  it('handles JSON body with special characters', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          key: '"quotes" and \\backslashes\\',
          nested: {
            array: ['item1', null, undefined],
          },
        }),
      },
    })

    expect(result).toBe(
      `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com"

	payload := bytes.NewBuffer([]byte(\`{
  "key": "\\"quotes\\" and \\\\backslashes\\\\",
  "nested": {
    "array": [
      "item1",
      null,
      null
    ]
  }
}\`))

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Set("Content-Type", "application/json")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles cookies with special characters', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
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

	req.Header.Add("Cookie", "special%3Bcookie=value%20with%20spaces")
	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('prettifies JSON body', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          nested: {
            array: [1, 2, 3],
            object: { foo: 'bar' },
          },
          simple: 'value',
        }),
      },
    })

    expect(result).toBe(
      `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type RequestNestedObject struct {
	Foo string \`json:"foo"\`
}

type RequestNested struct {
	Array  []int \`json:"array"\`
	Object struct {
		Foo string \`json:"foo"\`
	} \`json:"object"\`
}

type Request struct {
	Nested struct {
		Array  []int \`json:"array"\`
		Object struct {
			Foo string \`json:"foo"\`
		} \`json:"object"\`
	} \`json:"nested"\`
	Simple string \`json:"simple"\`
}

func main() {
	url := "https://example.com"

	payload := Request
	payload = Request{
		Nested: struct {
			Array  []int \`json:"array"\`
			Object struct {
				Foo string \`json:"foo"\`
			} \`json:"object"\`
		}{
			Array: []int{1, 2, 3},
			Object: struct {
				Foo string \`json:"foo"\`
			}{
				Foo: "bar",
			},
		},
		Simple: "value",
	}
	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))

	req.Header.Set("Content-Type", "application/json")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))
}`,
    )
  })

  it('handles URLs with dollar sign characters', () => {
    const result = goNative.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(
      `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://example.com/path$with$dollars"

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'price',
          value: '$100',
        },
        {
          name: 'currency',
          value: 'USD$',
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
	url := "https://example.com/?price=%24100&currency=USD%24"

	req, _ := http.NewRequest("GET", url, nil)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}`,
    )
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = goNative.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '$50.00',
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
	url := "https://example.com/api$v1/prices?amount=%2450.00"

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
