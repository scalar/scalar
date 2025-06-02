using System.Text.Json;
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Jobs;

namespace Scalar.AspNetCore.Benchmarks;

[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net90)]
[SimpleJob(RuntimeMoniker.Net80)]
public class ScalarOptionsMapperBenchmarks
{
    private ScalarOptions _simpleOptions = null!;

    [GlobalSetup]
    public void Setup()
    {
        _simpleOptions = new ScalarOptions
        {
            EnabledClients = [ScalarClient.HttpClient, ScalarClient.RestSharp],
            EnabledTargets = [ScalarTarget.CSharp]
        };
    }

    [Benchmark]
    public void MapSimpleOptions()
    {
        var configuration = _simpleOptions.ToScalarConfiguration();
        JsonSerializer.Serialize(configuration, typeof(ScalarConfiguration), ScalarConfigurationSerializerContext.Default);
    }
}