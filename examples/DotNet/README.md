# ASP.NET Core Sample

This example demonstrates Scalar integration with ASP.NET Core's [minimal APIs framework](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis/overview).

## Usage

### Requirements

- Docker
- .NET 9 Preview 4 SDK (https://github.com/dotnet/installer#table)

### Run

```bash
docker build -t scalar-dotnet-image .
```

```bash
docker run -it --rm -p 8080:8080 --name scalar-dotnet-sample scalar-dotnet-image
```

### Develop

Install the .NET 9 Preview 4 SDK as required above.

```bash
dotnet run
```

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
