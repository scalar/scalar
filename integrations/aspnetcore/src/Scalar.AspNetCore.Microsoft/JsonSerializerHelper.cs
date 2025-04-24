using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal static class JsonSerializerHelper
{
    internal static readonly JsonNode TrueNode = SerializeToNode(true);

    internal static JsonNode SerializeToNode<T>(T value) where T : notnull =>
        JsonSerializer.SerializeToNode(value, typeof(T), ScalarSerializerContext.Default) ?? throw new InvalidOperationException($"Failed to get node for value '{value}'.");
}

[JsonSerializable(typeof(bool))]
[JsonSerializable(typeof(string))]
[JsonSerializable(typeof(Stability))]
internal sealed partial class ScalarSerializerContext : JsonSerializerContext;