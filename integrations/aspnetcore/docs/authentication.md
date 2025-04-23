# Authentication

## Understanding Authentication in OpenAPI Documents

In the .NET ecosystem, there is a distinction between authentication mechanisms and their representation in OpenAPI documents. Simply adding an authentication scheme to the Dependency Injection (DI) container does not automatically include it in the OpenAPI document.

## How Scalar Works

`Scalar.AspNetCore` relies on the OpenAPI document to determine security schemes and requirements. If the OpenAPI document does not specify any security schemes, Scalar will not display any authentication options.

To include necessary authentication schemes in the OpenAPI document, implement an `OpenApiDocumentTransformer`. This allows you to add required security schemes to the OpenAPI document, ensuring `Scalar.AspNetCore` can recognize and display them. Multiple authentication schemes can be provided.
There is an [open GitHub issue](https://github.com/dotnet/aspnetcore/issues/39761) for automating this with .NET 10.

In the following sections, we will explain how to implement this transformer to add authentication schemes to your OpenAPI document.

## HTTP Authentication

### Configuring Bearer Authentication

To set up Bearer authentication in your API, configure the authentication scheme in the DI container:

```csharp
builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.Authority = "http://localhost:8080/realms/master/.well-known/openid-configuration";
});
```

Next, add this security scheme to the OpenAPI document by creating a custom `OpenApiDocumentTransformer`:

```csharp
options.AddDocumentTransformer((document, _, _) =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        In = ParameterLocation.Header,
        Scheme = "bearer"
    };
    document.Components ??= new OpenApiComponents();
    document.Components.SecuritySchemes.Add(JwtBearerDefaults.AuthenticationScheme, securityScheme);
    return Task.CompletedTask;
});
```

This transformer ensures that the required security scheme is included in the generated OpenAPI document. Once you start your project, you will see an option in the authentication dropdown.

### Adding a Global Security Requirement

Optionally, you can add a security requirement to the entire OpenAPI document. This step is not mandatory but can help enforce the use of the specified security scheme across all endpoints. Modify the `OpenApiDocumentTransformer` to include a security requirement:

```csharp
options.AddDocumentTransformer((document, _, _) =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        In = ParameterLocation.Header,
        Scheme = "bearer"
    };
    document.Components ??= new OpenApiComponents();
    document.Components.SecuritySchemes.Add(JwtBearerDefaults.AuthenticationScheme, securityScheme);

    // Adds a global security requirement
    var referenceScheme = new OpenApiSecurityScheme
    {
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };
    
    document.SecurityRequirements.Add(new OpenApiSecurityRequirement
    {
        [referenceScheme] = []
    });

    return Task.CompletedTask;
});
```

This addition ensures that the security scheme is applied globally to all operations in the OpenAPI document.

### Prefilling the Token

To make the usage of this scheme easier, you can prefill the `Token` in the `MapScalarApiReference()` method:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("BearerAuth")
    .AddHttpAuthentication("BearerAuth", auth =>
    {
        auth.Token = "ey...";
    });
);
```

This configuration preselects the `Bearer` authentication scheme in the API Reference and pre-fills the token with a given value.

### HTTP Basic Authentication

Similarly, you can set up Basic authentication using HTTP security scheme:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("BasicAuth")
    .AddHttpAuthentication("BasicAuth", auth =>
    {
        auth.Username = "your-username";
        auth.Password = "your-password";
    })
);
```

## OAuth2 Authentication

OAuth is a widely used authorization standard that typically uses a Bearer Token to authenticate users. It supports various flows, including Authorization Code, Implicit, Client Credentials, and Password.

When integrating OAuth with your API, you need to configure the appropriate OAuth flow as a security scheme in your OpenAPI document. This ensures that `Scalar.AspNetCore` can recognize and display the necessary authentication options based on the selected OAuth flow. It is possible to provide multiple flows for a security scheme.

### Configuring OAuth (Client Credentials Flow)

To set up OAuth authentication in your API, configure the authentication scheme in the DI container:

```csharp
builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.Authority = "http://localhost:8080/realms/master/.well-known/openid-configuration";
});
```

Next, add this security scheme to the OpenAPI document by creating a custom `OpenApiDocumentTransformer`:

```csharp
options.AddDocumentTransformer((document, _, _) =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            ClientCredentials = new OpenApiOAuthFlow
            {
                TokenUrl = new Uri("https://your-authorization-server.com/connect/token")
            }
        }
    };
    document.Components ??= new OpenApiComponents();
    document.Components.SecuritySchemes.Add("OAuth", securityScheme);
    return Task.CompletedTask;
});
```

### Using the Core OAuth2 Configuration Method

For direct control over OAuth2 security schemes, you can use the core `AddOAuth2Authentication` method. This is the foundation that all other OAuth2 configuration methods build on:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("OAuth")
    .AddOAuth2Authentication("OAuth", scheme =>
    {
        // Configure flows manually
        scheme.Flows = new ScalarFlows
        {
            AuthorizationCode = new AuthorizationCodeFlow
            {
                ClientId = "your-client-id"
            },
            ClientCredentials = new ClientCredentialsFlow
            {
                ClientId = "your-client-id",
                ClientSecret = "your-client-secret"
            }
        };
        
        // Set default scopes
        scheme.DefaultScopes = ["profile", "email"];
    });
);
```

> [!NOTE]
> All the OAuth2 convenience methods (`AddClientCredentialsFlow`, `AddAuthorizationCodeFlow`, 
> `AddImplicitFlow`, `AddPasswordFlow`, and `AddOAuth2Flows`) are wrappers around this core method 
> that make it easier to configure specific flows.

### Prefilling Client Credentials Flow

To make authentication easier for users, you can prefill the OAuth2 client credentials flow using the new authentication approach:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("OAuth")
    .AddClientCredentialsFlow("OAuth", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.ClientSecret = "your-client-secret";
        flow.SelectedScopes = ["profile", "email"];
    });
);
```

### Authorization Code Flow

For the Authorization Code flow, use the following configuration:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("OAuth")
    .AddAuthorizationCodeFlow("OAuth", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.ClientSecret = "your-client-secret";
        flow.Pkce = Pkce.Sha256; // Use PKCE for additional security
    });
);
```

### Implicit Flow

For the Implicit flow, configure it like this:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("OAuth")
    .AddImplicitFlow("OAuth", flow =>
    {
        flow.ClientId = "your-client-id";
    });
);
```

### Password Flow

For the Resource Owner Password Credentials flow:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("OAuth")
    .AddPasswordFlow("OAuth", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.Username = "default-username";
        flow.Password = "default-password";
    });
);
```

### Multiple OAuth Flows

You can configure multiple OAuth flows for the same security scheme:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("OAuth")
    .AddOAuth2Flows("OAuth", flows =>
    {
        // Configure Authorization Code flow
        flows.AuthorizationCode = new AuthorizationCodeFlow
        {
            ClientId = "your-client-id"
        };

        // Configure Client Credentials flow
        flows.ClientCredentials = new ClientCredentialsFlow
        {
            ClientId = "your-client-id",
            ClientSecret = "your-client-secret"
        };
    })
    // All OAuth flows will have preselected scopes
    .AddDefaultScopes("OAuth", ["profile", "email"])
);
```

### Overriding OpenAPI Document Values

When configuring authentication, you can also override values that are defined in the OpenAPI document. This is particularly useful when you need to change URLs or other properties without modifying the OpenAPI document itself.

For example, you can override the TokenUrl, AuthorizationUrl, or other endpoints defined in the OpenAPI document:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("OAuth")
    .AddOAuth2Flows("OAuth", flows =>
    {
        flows.AuthorizationCode = new AuthorizationCodeFlow
        {
            ClientId = "your-client-id",
            // Override AuthorizationUrl from OpenAPI document
            AuthorizationUrl = "https://your-custom-auth-server.com/authorize",
            // Override TokenUrl from OpenAPI document
            TokenUrl = "https://your-custom-auth-server.com/token",
            // Override RedirectUri from OpenAPI document
            RedirectUri = "https://your-app.com/custom-callback"
        };
    })
);
```

## API Key Authentication

For API Key authentication, configure it as follows:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("ApiKey")
    .AddApiKeyAuthentication("ApiKey", apiKey =>
    {
        apiKey.Value = "your-api-key";
    })
);
```

## Multiple Security Schemes

You can configure multiple security schemes in the same application:

```csharp
app.MapScalarApiReference(options => options
    .WithPreferredScheme("OAuth") // Set the preferred default scheme
    .AddOAuth2Flows("OAuth", flows =>
    {
        flows.AuthorizationCode = new AuthorizationCodeFlow
        {
            ClientId = "your-client-id"
        };
    })
    .AddApiKeyAuthentication("ApiKey", apiKey =>
    {
        apiKey.Value = "your-api-key";
    });
);
```

> [!WARNING]
> Sensitive Information: Pre-filled authentication details are exposed to the client/browser and may pose a security risk. Do not use this feature in production environments.