using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class OperationSorterJsonConverter : JsonConverter<OperationSorter>
{
    public override OperationSorter Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the OperationSorter enum.
        default;

    public override void Write(Utf8JsonWriter writer, OperationSorter value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}