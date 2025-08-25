using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class TagSorterJsonConverter : JsonConverter<TagSorter>
{
    public override TagSorter Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        // We don't have to implement this method because we don't need to deserialize the TagSorter enum.
        default;

    public override void Write(Utf8JsonWriter writer, TagSorter value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStringFast(true));
    }
}