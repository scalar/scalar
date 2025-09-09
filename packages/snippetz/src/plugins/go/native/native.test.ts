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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Post("https://example.com", "", nil)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://example.com", nil)
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	f, _ := os.Open("test.txt")
	defer f.Close()

	fw, _ := w.CreateFormFile("file", "test.txt")
	_, _ = fw.Write([]byte("file content"))

	w.WriteField("field", "value")
	w.Close()

	req, _ := http.NewRequest("POST", "https://example.com", &b)
	req.Header.Set("Content-Type", w.FormDataContentType())

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
	"net/url"
	"strings"
)

func main() {
	data := url.Values{}
	data.Set("special chars!@#", "value")

	res, err := http.Post("https://example.com", "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
	"strings"
)

func main() {
	res, err := http.Post("https://example.com", "application/octet-stream", strings.NewReader("binary content"))
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com/path%20with%20spaces/[brackets]")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://example.com", nil)
	req.Header.Add("X-Custom", "value1")
	req.Header.Add("X-Custom", "value2")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://example.com", nil)
	req.Header.Set("X-Empty", "")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com/api?param1=value1&param2=special%20value&param3=123")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

type Request struct {
	Hello string \`json:"hello"\`
}

func main() {
	payload := Request{
		Hello: "world",
	}
	jsonData, _ := json.Marshal(payload)

	res, err := http.Post("https://example.com", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com/?foo=bar&bar=foo")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://example.com", nil)
	req.Header.Set("Cookie", "foo=bar; bar=foo")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://example.com", nil)
	req.SetBasicAuth("user", "pass")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://example.com", nil)
	req.SetBasicAuth("user@example.com", "pass:word!")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	payload := bytes.NewBuffer([]byte(\`{
  "foo": "bar"
}\`))

	req, _ := http.NewRequest("POST", "https://example.com", payload)
	req.Header.Set("Content-Type", "multipart/form-data")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://example.com", nil)
	req.Header.Set("Accept-Encoding", "gzip, deflate")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com/?q=hello%20world%20%26%20more&special=%21%40%23%24%25%5E%26*%28%29")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com/${'a'.repeat(2000)}")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	f, _ := os.Open("")
	defer f.Close()

	fw, _ := w.CreateFormFile("file", "")
	_, _ = fw.Write([]byte("file content"))

	w.Close()

	req, _ := http.NewRequest("POST", "https://example.com", &b)
	req.Header.Set("Content-Type", w.FormDataContentType())

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"encoding/json"
	"fmt"
	"net/http"
)

type Request struct {
	Key    string \`json:"key"\`
	Nested struct {
		Array []string \`json:"array"\`
	} \`json:"nested"\`
}

func main() {
	payload := Request{
		Key: "\"quotes\" and \\\\backslashes\\\\",
		Nested: struct {
			Array []string \`json:"array"\`
		}{
			Array: []string{"item1", "", ""},
		},
	}
	jsonData, _ := json.Marshal(payload)

	res, err := http.Post("https://example.com", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://example.com", nil)
	req.Header.Set("Cookie", "special%3Bcookie=value%20with%20spaces")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

type Payload struct {
	Nested struct {
		Array  []int \`json:"array"\`
		Object struct {
			Foo string \`json:"foo"\`
		} \`json:"object"\`
	} \`json:"nested"\`
	Simple string \`json:"simple"\`
}

func main() {
	var p Payload
	p.Nested.Array = []int{1, 2, 3}
	p.Nested.Object.Foo = "bar"
	p.Simple = "value"

	b, _ := json.Marshal(p)
	res, err := http.Post("https://example.com", "application/json", bytes.NewBuffer(b))
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
}
`,
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com/path$with$dollars")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com/?price=%24100&currency=USD%24")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
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
	"net/http"
)

func main() {
	res, err := http.Get("https://example.com/api$v1/prices?amount=%2450.00")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer res.Body.Close()
}`,
    )
  })
})
