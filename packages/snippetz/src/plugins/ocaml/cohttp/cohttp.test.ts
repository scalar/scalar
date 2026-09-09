import { describe, expect, it } from 'vitest'

import { ocamlCohttp } from './cohttp'

describe('cohttp', () => {
  it('returns a basic request', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('returns a POST request', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('has headers', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/json");
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it("doesn't add empty headers", () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('has JSON body', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/json");
    ] in
    let part0 = "{\\"hello\\":\\"world\\"}" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('has query string', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com?foo=bar&bar=foo" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('joins query string parameters with & when the URL already has a query string', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com/api?existing=1',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com/api?existing=1&foo=bar" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('quotes a URL whose query string has no other special characters', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com/api?param1=value1&param2=value2',
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com/api?param1=value1&param2=value2" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('has cookies', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Cookie", "foo=bar; bar=foo");
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it("doesn't add empty cookies", () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('adds basic auth credentials', () => {
    const result = ocamlCohttp.generate(
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Authorization", "Basic dXNlcjpwYXNz");
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('omits auth when not provided', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('omits auth when username is missing', () => {
    const result = ocamlCohttp.generate(
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('omits auth when password is missing', () => {
    const result = ocamlCohttp.generate(
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles special characters in auth credentials', () => {
    const result = ocamlCohttp.generate(
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Authorization", "Basic dXNlckBleGFtcGxlLmNvbTpwYXNzOndvcmQh");
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles undefined auth object', () => {
    const result = ocamlCohttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles multipart form data with files', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data; boundary=scalar-boundary");
    ] in
    let part0 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"file\\"; filename=\\"test.txt\\"\\013\\010Content-Type: application/octet-stream\\013\\010\\013\\010" in
    Lwt_io.with_file ~mode:Lwt_io.Input "test.txt" Lwt_io.read >>= fun part1 ->
    let part2 = "\\013\\010" in
    let part3 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"field\\"\\013\\010\\013\\010" in
    let part4 = "value" in
    let part5 = "\\013\\010" in
    let part6 = "--scalar-boundary--\\013\\010" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0; part1; part2; part3; part4; part5; part6]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles multipart form data content types on string parts', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'user',
            value: '{"name":"scalar"}',
            contentType: 'application/json;charset=utf-8',
          },
        ],
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data; boundary=scalar-boundary");
    ] in
    let part0 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"user\\"\\013\\010Content-Type: application/json;charset=utf-8\\013\\010\\013\\010" in
    let part1 = "{\\"name\\":\\"scalar\\"}" in
    let part2 = "\\013\\010" in
    let part3 = "--scalar-boundary--\\013\\010" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0; part1; part2; part3]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('pretty-prints JSON multipart parts alongside file parts', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com/widget/v1/widgets',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'multipart/form-data',
        },
      ],
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'filename',
          },
          {
            name: 'props',
            value: '{"name":"","description":"","created_at":null}',
            contentType: 'application/json',
          },
        ],
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com/widget/v1/widgets" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data; boundary=scalar-boundary");
    ] in
    let part0 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"file\\"; filename=\\"filename\\"\\013\\010Content-Type: application/octet-stream\\013\\010\\013\\010" in
    Lwt_io.with_file ~mode:Lwt_io.Input "filename" Lwt_io.read >>= fun part1 ->
    let part2 = "\\013\\010" in
    let part3 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"props\\"\\013\\010Content-Type: application/json\\013\\010\\013\\010" in
    let part4 = "{\\"name\\":\\"\\",\\"description\\":\\"\\",\\"created_at\\":null}" in
    let part5 = "\\013\\010" in
    let part6 = "--scalar-boundary--\\013\\010" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0; part1; part2; part3; part4; part5; part6]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('leaves non-JSON multipart values untouched when contentType claims JSON', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'props',
            value: 'not json',
            contentType: 'application/json',
          },
        ],
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data; boundary=scalar-boundary");
    ] in
    let part0 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"props\\"\\013\\010Content-Type: application/json\\013\\010\\013\\010" in
    let part1 = "not json" in
    let part2 = "\\013\\010" in
    let part3 = "--scalar-boundary--\\013\\010" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0; part1; part2; part3]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles multipart form data content types on files', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'test.txt',
            contentType: 'text/plain',
          },
        ],
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data; boundary=scalar-boundary");
    ] in
    let part0 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"file\\"; filename=\\"test.txt\\"\\013\\010Content-Type: text/plain\\013\\010\\013\\010" in
    Lwt_io.with_file ~mode:Lwt_io.Input "test.txt" Lwt_io.read >>= fun part1 ->
    let part2 = "\\013\\010" in
    let part3 = "--scalar-boundary--\\013\\010" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0; part1; part2; part3]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: "field'name",
            value: 'value',
          },
          {
            name: "file'name",
            fileName: 'test.txt',
          },
        ],
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data; boundary=scalar-boundary");
    ] in
    let part0 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"field'name\\"\\013\\010\\013\\010" in
    let part1 = "value" in
    let part2 = "\\013\\010" in
    let part3 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"file'name\\"; filename=\\"test.txt\\"\\013\\010Content-Type: application/octet-stream\\013\\010\\013\\010" in
    Lwt_io.with_file ~mode:Lwt_io.Input "test.txt" Lwt_io.read >>= fun part4 ->
    let part5 = "\\013\\010" in
    let part6 = "--scalar-boundary--\\013\\010" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0; part1; part2; part3; part4; part5; part6]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data");
    ] in
    let part0 = "{\\"foo\\":\\"bar\\"}" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/x-www-form-urlencoded");
    ] in
    let part0 = "special+chars%21%40%23=value" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: "field'name",
            value: 'value',
          },
        ],
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/x-www-form-urlencoded");
    ] in
    let part0 = "field%27name=value" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles binary data flag', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/octet-stream");
    ] in
    let part0 = "binary content" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles compressed response', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Accept-Encoding", "gzip, deflate");
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles special characters in URL', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com/path%20with%20spaces/[brackets]" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles special characters in query parameters', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'q',
          value: 'hello%20world%20%26%20more',
        },
        {
          name: 'special',
          value: '!%40%23%24%25%5E%26*()',
        },
      ],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles empty URL', () => {
    const result = ocamlCohttp.generate({
      url: '',
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles extremely long URLs', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com/${'a'.repeat(2000)}" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles multiple headers with same name', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("X-Custom", "value1");
      ("X-Custom", "value2");
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles headers with empty values', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("X-Empty", "");
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data; boundary=scalar-boundary");
    ] in
    let part0 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"file\\"; filename=\\"\\"\\013\\010Content-Type: application/octet-stream\\013\\010\\013\\010" in
    Lwt_io.with_file ~mode:Lwt_io.Input "" Lwt_io.read >>= fun part1 ->
    let part2 = "\\013\\010" in
    let part3 = "--scalar-boundary--\\013\\010" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0; part1; part2; part3]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles JSON body with special characters', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/json");
    ] in
    let part0 = "{\\"key\\":\\"\\\\\\"quotes\\\\\\" and \\\\\\\\backslashes\\\\\\\\\\",\\"nested\\":{\\"array\\":[\\"item1\\",null,null]}}" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles cookies with special characters', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Cookie", "special%3Bcookie=value%20with%20spaces");
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('prettifies JSON body', () => {
    const result = ocamlCohttp.generate({
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

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/json");
    ] in
    let part0 = "{\\"nested\\":{\\"array\\":[1,2,3],\\"object\\":{\\"foo\\":\\"bar\\"}},\\"simple\\":\\"value\\"}" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles URLs with dollar sign characters', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com/path$with$dollars" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'price',
          value: '%24100',
        },
        {
          name: 'currency',
          value: 'USD%24',
        },
      ],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com?price=%24100&currency=USD%24" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com/api$v1/prices?amount=%2450.00" in
    let headers = Cohttp.Header.of_list [
    ] in
    Cohttp_lwt_unix.Client.call ~headers (Cohttp.Code.method_of_string "GET") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('pretty-prints --data bodies whose mimeType uses a +json suffix', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/vnd.api+json");
    ] in
    let part0 = "{\\"a\\":1}" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('pretty-prints --data bodies whose mimeType includes a charset parameter', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/json;charset=utf-8");
    ] in
    let part0 = "{\\"a\\":1}" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('pretty-prints --form parts whose contentType uses a +json suffix', () => {
    const result = ocamlCohttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'props',
            value: '{"a":1}',
            contentType: 'application/vnd.custom+json',
          },
        ],
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://example.com" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "multipart/form-data; boundary=scalar-boundary");
    ] in
    let part0 = "--scalar-boundary\\013\\010Content-Disposition: form-data; name=\\"props\\"\\013\\010Content-Type: application/vnd.custom+json\\013\\010\\013\\010" in
    let part1 = "{\\"a\\":1}" in
    let part2 = "\\013\\010" in
    let part3 = "--scalar-boundary--\\013\\010" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0; part1; part2; part3]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })

  it('escapes single quotes in JSON body', () => {
    const result = ocamlCohttp.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toBe(`open Lwt.Infix

let () =
  Lwt_main.run (
    let uri = Uri.of_string "https://editor.scalar.com/test" in
    let headers = Cohttp.Header.of_list [
      ("Content-Type", "application/json");
    ] in
    let part0 = "\\"hell'o\\"" in
    let body = Cohttp_lwt.Body.of_string (String.concat "" [part0]) in
    Cohttp_lwt_unix.Client.call ~headers ~body (Cohttp.Code.method_of_string "POST") uri
    >>= fun (_response, body) ->
    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl
  )`)
  })
})
