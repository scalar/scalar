using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class OperationTitleSourceJsonConverter : JsonConverter<OperationTitleSource>
{
    public override OperationTitleSource Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the OperationTitleSource enum.
        default;

    public override void Write(Utf8JsonWriter writer, OperationTitleSource value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}