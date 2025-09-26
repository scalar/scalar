# Enum Generation Script

Automatically generates C# enums from TypeScript clients configuration.

## Usage

```bash
pnpm generate:enums
```

## Generated Files

- `ScalarTarget.Generated.cs` - Programming language targets (C#, JavaScript, etc.)
- `ScalarClient.Generated.cs` - HTTP clients (HttpClient, Fetch, etc.) 
- `ScalarOptionsMapper.Generated.cs` - Target → Client mappings

Customize PascalCase mappings in `CUSTOM_PASCAL_CASE_MAPPINGS` or obsolete clients in `OBSOLETE_CLIENT_ENTRIES` when needed.