using System.Text.Json;

namespace Scalar.Shared.Tests;

public class MultipartNamingTests
{
    [Fact]
    public void WithMultipartNaming_SerializesIndexedDotAndOmitsDefault()
    {
        var options = new ScalarOptions();
        var context = ScalarConfigurationSerializerContext.Default.ScalarConfiguration;

        JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), context)
            .TryGetProperty("multipartNaming", out _).Should().BeFalse();

        options.WithMultipartNaming(ScalarMultipartNaming.IndexedDot).Should().BeSameAs(options);

        JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), context)
            .GetProperty("multipartNaming").GetString().Should().Be("indexed-dot");
    }
}
