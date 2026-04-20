# Code Generation

Scalar generates a ready-to-copy code snippet for every request in 40+ HTTP clients across 21 languages. Pick a language from the picker next to the snippet, copy it, and paste it into your app.

## Live updates

The snippet re-renders as you edit the request: change a header, swap the active environment, add a body field, and the code updates immediately. `{{ environment variables }}` and `{{$dynamic-variables}}` are resolved to their current values in the output, so the snippet is ready to run without further substitution.

## Customize with OpenAPI

Override the generated snippet for any operation with the `x-code-samples` extension. Each entry sets a language tag, a label shown in the language picker, and the full source. Custom samples are listed alongside the generated ones.

```yaml
openapi: 3.1.0
info:
  title: Hello World
  version: 1.0.0
paths:
  /users:
    post:
      summary: Create a user
      x-code-samples:
        - lang: bash
          label: cURL (with retry)
          source: |
            curl --retry 3 --retry-delay 2 \
              -X POST https://api.example.com/users \
              -H "Content-Type: application/json" \
              -d '{"name":"Jane"}'
        - lang: python
          label: Python (requests + retries)
          source: |
            import requests
            from requests.adapters import HTTPAdapter, Retry

            session = requests.Session()
            session.mount('https://', HTTPAdapter(max_retries=Retry(total=3, backoff_factor=2)))
            session.post('https://api.example.com/users', json={'name': 'Jane'})
```

Each sample has:

| Field | Description |
| --- | --- |
| `lang` | Language identifier (for example, `bash`, `python`, `javascript`) |
| `label` | Display label shown in the language picker |
| `source` | The full snippet source code |

## Supported languages

| Language | Clients |
| --- | --- |
| C | Libcurl |
| C# | HttpClient, RestSharp |
| Clojure | clj-http |
| Dart | Http |
| F# | HttpClient |
| Go | NewRequest |
| HTTP | HTTP/1.1 |
| Java | AsyncHttp, java.net.http, OkHttp, Unirest |
| JavaScript | Fetch, Axios, ofetch, jQuery, XHR |
| Kotlin | OkHttp |
| Node.js | Fetch, Axios, ofetch, undici |
| Objective-C | NSURLSession |
| OCaml | Cohttp |
| PHP | cURL, Guzzle, Laravel HTTP Client |
| PowerShell | Invoke-WebRequest, Invoke-RestMethod |
| Python | http.client, Requests, aiohttp, HTTPX (Sync), HTTPX (Async) |
| R | httr2 |
| Ruby | net::http |
| Rust | reqwest |
| Shell | Curl, Wget, HTTPie |
| Swift | NSURLSession |
