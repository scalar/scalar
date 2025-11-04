# Enum Generation Scripts

Automatically generates language-specific enums from TypeScript clients configuration. These scripts directly import the clients array, ensuring the generated enums stay in perfect sync with the TypeScript source of truth.

## Usage

### .NET Enum Generation

```bash
pnpm generate:dotnet-enums
```

Generates C# enums for the .NET integration packages.

#### Generated Files (.NET)

- `ScalarTarget.Generated.cs` - Programming language targets (C#, JavaScript, etc.)
- `ScalarClient.Generated.cs` - HTTP clients (HttpClient, Fetch, etc.) 
- `ScalarOptionsMapper.Generated.cs` - Target → Client mappings

Generated in: `integrations/dotnet/shared/src/Scalar.Shared/`

### Java Enum Generation

```bash
pnpm generate:java-enums
```

Generates Java enums for the Java integration packages.

#### Generated Files (Java)

- `ScalarTarget.java` - Programming language targets (Java, JavaScript, etc.)
- `ScalarClient.java` - HTTP clients (OkHttp, AsyncHttp, etc.)

Generated in: `integrations/java/webjar/src/main/java/com/scalar/maven/webjar/enums/`

## Customization

### .NET Generator

Customize PascalCase mappings in `CUSTOM_PASCAL_CASE_MAPPINGS` or obsolete clients in `OBSOLETE_CLIENT_ENTRIES` in `generate-dotnet-enums.ts` when needed.

### Java Generator

Customize SCREAMING_SNAKE_CASE mappings in `CUSTOM_JAVA_MAPPINGS` or obsolete clients in `OBSOLETE_CLIENT_ENTRIES` in `generate-java-enums.ts` when needed.
