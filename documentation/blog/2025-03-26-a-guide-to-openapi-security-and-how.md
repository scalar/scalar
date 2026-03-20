# A guide to OpenAPI security (and how we handle it in Scalar)

Just like the real world, there are often areas of your code you want to protect and you set up security to protect them. Unlike the real world, it’s often not obvious how to interact with these security mechanisms, especially when it comes to APIs.

This is where defining security in OpenAPI documentation comes in. This enables you to define the authentication and authorization mechanisms you’ve put into place. This helps the users of your API understand security requirements and interact with protected parts of your API in the right way.

This post details the types of security, how to define them in your OpenAPI doc, and how they work in Scalar’s API reference and client.

> **What about security definitions?** This was the name of the same concept security schemes in OpenAPI 2 (formerly Swagger).

## The many types of security for OpenAPI docs

OpenAPI documents are representations of real APIs and those real APIs have many different ways of securing their data. The types of security you can define include:

1. **API keys:** These can be sent in headers, query parameters, or cookies.
2. **HTTP:** This includes both basic username and password as well as bearer tokens. You can also define the `bearerFormat` such as `JWT`.
3. **OAuth 2.0:** Supports multiple types of authorization flows, from standard redirect-based to direct sign-in to application-level. Each flow can define where to request authorization, where to exchange codes for tokens, and available permissions.
4. **OpenID Connect:** Finally, OpenID builds on top of OAuth 2.0. It allows clients to automatically get configuration information using a “well-known” discovery endpoint.

Each of these can be combined using `AND/OR` logic. They can also be applied globally or per-operation.

## How to define OpenAPI security

Defining your OpenAPI security starts by adding the `securitySchemes` property. This defines all the security schemes your API supports. You then use `security` to apply the schemes globally or per-operation.

You can think of `securitySchemes` like the ID types available (passport, driver’s license, badge) while `security` specifies which IDs are required to enter.

For example, if you want to include either `BasicAuth` or `ApiKeyAuth` anywhere in your OpenAPI doc, it starts by defining them as `securitySchemes`:

```
components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

With `securitySchemes` defined, you can then apply them at the global level by adding `security` like this:

```
security:
  - ApiKeyAuth: []
  - BasicAuth: []

components:
  securitySchemes:
# ... rest of your OpenAPI doc
```

With `security` set up, you can define your `securitySchemes`. This can apply to individual operations or globally. For example, to apply `BasicAuth` globally, you OpenAPI file would look like this:

```
security:
  - BasicAuth: []

components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
      description: Basic Authentication using username and password
# ... rest of your OpenAPI file
```

To apply it to a single operation, define the `security` property on the path like we do here:

```
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: API key for protected endpoints

paths:
  /orders:
    post:
      summary: Create new order
      description: Protected endpoint - requires API key
      security:
        - ApiKeyAuth: [] # This operation requires API key
      responses:
        '201':
          description: Order created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  orderId:
                    type: integer
                  status:
                    type: string
        '401':
          description: Unauthorized - invalid or missing API key
  # ... rest of your OpenAPI file
```

Each security scheme also has different properties beyond `type` and the optional `description` you can define. For example:

* `apiKey` has `in` and `name`
* `http` has `scheme` and `bearerFormat`
* `oauth2` has `flows` which has `authorizationCode`, `implicit`, and `password` each with their own properties
* `OpenIdConnect` has `openIdConnectUrl`

Of course, the flip side of all of this is that the OpenAPI doc is just a representation of your actual underlying API. You need to actually implement the security.

### Defining security with your framework

A nice thing about modern API development frameworks is that they generate OpenAPI docs for you. This also means that they provide easy ways to define security for your API. Here’s an example for [Hono](https://github.com/honojs/middleware/tree/main/packages/zod-openapi#how-to-setup-authorization):

```
// Register the security scheme in your OpenAPI docs
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  description: 'Enter your JWT token in the format: Bearer <token>',
})

// Apply the security to your routes
const route = createRoute({
  method: 'get',
  path: '/protected-resource',
  security: [{ Bearer: [] }],
  handler: async (c) => {
    const token = c.req.header('Authorization')
    // Token validation logic here
    return c.json({ message: 'Protected data' })
  },
})
```

And to add JWT authorization to a .NET API:

```
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options => {
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement {{
        new OpenApiSecurityScheme {
            Reference = new OpenApiReference {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        },
        Array.Empty<string>()
    }});
});

// Apply authentication to your endpoints
app.MapGet("/protected", [Authorize] () => "This endpoint requires authentication")
   .WithOpenApi();
```

And finally, for FastAPI:

```
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

app = FastAPI(
    title="Protected API",
    description="API secured with HTTP Basic Auth"
)

security = HTTPBasic()

def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    # In production, use secure password comparison
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(credentials.password, "secret")

    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/secure-data/",
    summary="Get protected data",
    responses={
        401: {"description": "Invalid credentials"},
        200: {"description": "Successfully authenticated"}
    })
def secure_data(username: str = Depends(verify_credentials)):
    return {"message": f"Hello, {username}"}
```

This is where it really pays off to have a framework that generates the OpenAPI doc (well) for you. For example, Django doesn’t generate an OpenAPI doc automatically, making interacting with it for API reference or debugging a lot harder.

## How Scalar handles security

The whole point of defining a security scheme is that it makes using an API easier. This means API references and clients need to handle the many security schemes OpenAPI provides.

### API reference

Our [API reference](https://galaxy.scalar.com/) supports API key, HTTP, and OAuth 2.0 security schemes. Based on your OpenAPI document and the security schemes applied to your operations, users can choose one of these and send requests with it.

Behind the scenes, we handle the logic for applying the correct scheme for each operation, include the UI to gather the needed information, set up the correct auth method on users requests, handle state for the auth, and handle errors that come from invalid credentials or other auth failures.

### API client

The [API client](https://client.scalar.com/) looks very similar. The big difference is that because your client state can be private to you, we can store it between sessions and collections. This also means you might have multiple collections as well as multiple active security schemes.

To handle this, we store auth values at the collection-level, support operation-level overrides, and allow you to select the scheme on want on per-request. The selectors for schemes are also more interactive, allowing editing of API key name fields and scheme deletion.

Our API client also pre-fills as much information as possible. It auto detects security schemes, creates default value structures based on scheme types, pre-configs OAuth flows if provided, and more.

## Supporting API security and developer experience

As with many areas of Scalar, we continue to improve the connection between your OpenAPI doc, API reference, and API client. For example, we recently added the ability to sync authentication settings between the API reference and the API client. The API reference can pass auth settings to the client modal and the select security schemes become the default in the client.

Security shouldn’t come at the cost of developer experience. The tools Scalar provides helps developers authenticate quickly and correctly. This helps them test endpoints, debug, and ultimately build better (and more secure) APIs.

**Mar 26, 2025**
