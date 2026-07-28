# HTTP API event model (payload format 2.0)

`Scalar.Aws.Lambda` only supports Amazon API Gateway **HTTP APIs** using **payload format 2.0**, the model
represented by `APIGatewayHttpApiV2ProxyRequest` / `APIGatewayHttpApiV2ProxyResponse` in
`Amazon.Lambda.APIGatewayEvents`.

## The `{proxy+}` route

HTTP APIs support a greedy `{proxy+}` path parameter, analogous to ASP.NET Core's catch-all route parameter. Declare
your route with `{proxy+}` and Scalar reads the remainder directly from `request.PathParameters["proxy"]`:

```yaml
Events:
  ScalarIndex:
    Type: HttpApi
    Properties:
      Path: /scalar
      Method: GET
  ScalarProxy:
    Type: HttpApi
    Properties:
      Path: /scalar/{proxy+}
      Method: ANY
```

- `GET /scalar` and `GET /scalar/` render the reference index for the default document.
- `GET /scalar/v3` renders the reference index for the `v3` document.
- `GET /scalar/scalar.js`, `GET /scalar/scalar.aws.lambda.js` and `GET /scalar/favicon.svg` serve the embedded
  static assets.

If no `PathParameters` are present at all (for example when the function is invoked directly, without going
through the API Gateway proxy integration), the request is treated as an index request rather than throwing.

## Stage handling

HTTP APIs embed the stage name as a path segment in `RawPath` for any **named** stage, but not for the special
`$default` stage:

| Stage       | `RawPath` for `GET /scalar/` | Behavior                                             |
|-------------|------------------------------|-------------------------------------------------------|
| `$default`  | `/scalar/`                   | No prefix stripped.                                    |
| `prod`      | `/prod/scalar/`               | `prod` is auto-detected and stripped from relative URLs. |

`Scalar.Aws.Lambda` reads `request.RequestContext.Stage` and, unless you already set `ScalarOptions.RoutePrefix`
explicitly, folds the stage name into `RoutePrefix` before resolving relative URLs. This mirrors how the Azure
Functions integration folds the Azure Functions HTTP route prefix (`host.json`'s `routePrefix`) into the same
option.

A custom domain name base path mapping adds a prefix that is **not** reflected in `RequestContext.Stage` — in that
case, set `ScalarOptions.RoutePrefix` explicitly to the base path.

## Headers

API Gateway HTTP APIs lowercase header names and combine duplicate headers with commas in the `headers` field
(there is no `multiValueHeaders` field, unlike REST APIs / payload format 1.0). `Scalar.Aws.Lambda` reads
`Accept-Encoding` and `If-None-Match` case-insensitively, so this is handled correctly regardless of how the caller
casings the header names (API Gateway normally lowercases them, but direct test invocations might not).

## Response body encoding

`APIGatewayHttpApiV2ProxyResponse.IsBase64Encoded` is set to `true` only when the response body is a
gzip-compressed static asset (binary content); HTML pages and uncompressed static assets are returned as plain
UTF-8 text with `IsBase64Encoded = false`.
