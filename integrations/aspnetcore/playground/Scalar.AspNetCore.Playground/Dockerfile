FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish "playground/Scalar.AspNetCore.Playground/Scalar.AspNetCore.Playground.csproj" -c Release -o /app /p:PublishAot=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
ENTRYPOINT ["dotnet", "Scalar.AspNetCore.Playground.dll"]
