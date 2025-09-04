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

## How It Works

1. Scans all TypeScript plugins in `/packages/snippetz/src/plugins/`
2. Extracts `target`, `client`, and `title` from each plugin file
3. Generates C# enums with auto-generated headers and PascalCase naming

## Maintenance

The generator is fully dynamic. Adding/removing plugins automatically updates the generated enums.

Only customize PascalCase mappings in `CUSTOM_PASCAL_CASE_MAPPINGS` when needed.