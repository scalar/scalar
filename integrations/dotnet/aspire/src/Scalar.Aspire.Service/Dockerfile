# build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS publish
WORKDIR /src

COPY Directory.Build.props .
COPY ./aspire .

WORKDIR "/src/src/Scalar.Aspire.Service"
RUN dotnet publish "Scalar.Aspire.Service.csproj" -c Release -o /app/publish /p:UseAppHost=false

# final stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
WORKDIR /app
COPY --from=publish /app/publish .

# use non-root user
USER $APP_UID
EXPOSE 8080

ENTRYPOINT ["dotnet", "Scalar.Aspire.Service.dll"]
