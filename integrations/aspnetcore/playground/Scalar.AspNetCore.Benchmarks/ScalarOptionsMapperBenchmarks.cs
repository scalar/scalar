using System.Text.Json;
using BenchmarkDotNet.Attributes;

namespace Scalar.AspNetCore.Benchmarks;

[MemoryDiagnoser]
[ShortRunJob]
[MarkdownExporterAttribute.GitHub]
public class ScalarOptionsMapperBenchmarks
{
    private ScalarOptions _simpleOptions = null!;

    [GlobalSetup]
    public void Setup()
    {
        _simpleOptions = new ScalarOptions();
    }

    [Benchmark(Baseline = true)]
    public void MapSimpleOptions()
    {
        var configuration = _simpleOptions.ToScalarConfiguration();
        JsonSerializer.Serialize(configuration, typeof(ScalarConfiguration), ScalarConfigurationSerializerContext.Default);
    }
}