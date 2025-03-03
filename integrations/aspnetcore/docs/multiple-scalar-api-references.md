# Multiple Scalar API References

This example demonstrates how to configure multiple Scalar API references, each mapped to a separate endpoint, and how to use separate OpenAPI documents for each reference.

## Configuring Multiple API References

To configure multiple API references, use the `MapScalarApiReference` method with a parameter to map the reference to a separate endpoint. Additionally, use the `AddDocument` method to specify the OpenAPI documents for each reference.

### Example

```csharp
builder.Services.AddOpenApi("internal");
builder.Services.AddOpenApi("public");

// Map Scalar API references to separate endpoints
app.MapScalarApiReference("/api-reference-internal", options => options.AddDocument("internal"));
app.MapScalarApiReference("/api-reference", options => options.AddDocument("public"));
```