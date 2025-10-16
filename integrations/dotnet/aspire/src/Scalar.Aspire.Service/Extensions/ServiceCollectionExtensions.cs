namespace Scalar.Aspire.Service.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static void AddScalarLogger(this IServiceCollection services)
    {
        services.AddSingleton<ILogger>(provider => provider.GetRequiredService<ILoggerFactory>().CreateLogger("Scalar.Aspire.Service"));
    }
}