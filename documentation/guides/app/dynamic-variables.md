# Dynamic Variables

Dynamic variables generate fresh values every time you send a request — timestamps, UUIDs, fake names, random integers, and more. Reference them with a `$`-prefixed name inside double curly braces:

```
{{$randomEmail}}
```

Dynamic variables resolve in the URL, headers, request body, and authentication fields — anywhere you can type a value.

## Using dynamic variables

Mix dynamic variables anywhere a value is expected:

```http
POST https://api.example.com/users?requestId={{$guid}}
Authorization: Bearer {{$randomUUID}}
Content-Type: application/json

{
  "name": "{{$randomFullName}}",
  "email": "{{$randomEmail}}",
  "createdAt": "{{$isoTimestamp}}"
}
```

Each reference resolves to a new value every time the request runs. Two `{{$guid}}` placeholders in the same request produce two different UUIDs.

## Autocomplete

Start typing `{{` in any input and the client surfaces a picker with the most common variables first (`$guid`, `$timestamp`, `$isoTimestamp`, `$randomUUID`, `$randomEmail`, `$randomInt`, `$randomFirstName`, `$randomLastName`), followed by the full list. Each variable shows a short description when you hover it.

## Mixing with environment variables

Dynamic variables coexist with [environment variables](./environments.md) in the same string:

```
GET {{baseUrl}}/users/{{$randomInt}}
```

## In OpenAPI documents

Dynamic variables resolve in any string the client sends, including values sourced from your OpenAPI document. Add them to `example` fields on parameters, request bodies, or schemas so every request the client sends uses fresh data:

```yaml
openapi: 3.1.0
info:
  title: Galaxy Users
  version: 1.0.0
paths:
  /users:
    post:
      summary: Create a user
      parameters:
        - name: X-Request-Id
          in: header
          required: true
          schema:
            type: string
          example: '{{$guid}}'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
                email:
                  type: string
                createdAt:
                  type: string
                  format: date-time
            example:
              id: '{{$randomUUID}}'
              name: '{{$randomFullName}}'
              email: '{{$randomEmail}}'
              createdAt: '{{$isoTimestamp}}'
      responses:
        '201':
          description: Created
```

Every time the client sends a request built from this document, the `X-Request-Id` header and the four body fields are replaced with fresh values.

## Reference

### Common

| Variable | Description |
| --- | --- |
| `{{$guid}}` | A uuid-v4 style guid |
| `{{$timestamp}}` | The current UNIX timestamp in seconds |
| `{{$isoTimestamp}}` | The current ISO timestamp at zero UTC |
| `{{$randomUUID}}` | A random 36-character UUID |

### Text, numbers, and colors

| Variable | Description |
| --- | --- |
| `{{$randomAlphaNumeric}}` | A random alpha-numeric character |
| `{{$randomBoolean}}` | A random boolean value |
| `{{$randomInt}}` | A random integer between 0 and 1000 |
| `{{$randomColor}}` | A random color in hex format |
| `{{$randomHexColor}}` | A random hex value |
| `{{$randomAbbreviation}}` | A random abbreviation |

### Internet and IP addresses

| Variable | Description |
| --- | --- |
| `{{$randomIP}}` | A random IPv4 address |
| `{{$randomIPV6}}` | A random IPv6 address |
| `{{$randomMACAddress}}` | A random MAC address |
| `{{$randomPassword}}` | A random 15-character alpha-numeric password |
| `{{$randomLocale}}` | A random two-letter language code (ISO 639-1) |
| `{{$randomUserAgent}}` | A random user agent |
| `{{$randomProtocol}}` | A random internet protocol |
| `{{$randomSemver}}` | A random semantic version number |

### Names

| Variable | Description |
| --- | --- |
| `{{$randomFirstName}}` | A random first name |
| `{{$randomLastName}}` | A random last name |
| `{{$randomFullName}}` | A random first and last name |
| `{{$randomNamePrefix}}` | A random name prefix |
| `{{$randomNameSuffix}}` | A random name suffix |

### Profession

| Variable | Description |
| --- | --- |
| `{{$randomJobArea}}` | A random job area |
| `{{$randomJobDescriptor}}` | A random job descriptor |
| `{{$randomJobTitle}}` | A random job title |
| `{{$randomJobType}}` | A random job type |

### Phone, address, and location

| Variable | Description |
| --- | --- |
| `{{$randomPhoneNumber}}` | A random ten-digit phone number |
| `{{$randomPhoneNumberExt}}` | A random phone number prefixed with a two-digit extension (10–99) |
| `{{$randomCity}}` | A random city name |
| `{{$randomStreetName}}` | A random street name |
| `{{$randomStreetAddress}}` | A random street address |
| `{{$randomCountry}}` | A random country |
| `{{$randomCountryCode}}` | A random two-letter country code (ISO 3166-1 alpha-2) |
| `{{$randomLatitude}}` | A random latitude coordinate |
| `{{$randomLongitude}}` | A random longitude coordinate |

### Images

| Variable | Description |
| --- | --- |
| `{{$randomAvatarImage}}` | A random avatar image |
| `{{$randomImageUrl}}` | A URL of a random image |
| `{{$randomAbstractImage}}` | A URL of a random abstract image |
| `{{$randomAnimalsImage}}` | A URL of a random animal image |
| `{{$randomBusinessImage}}` | A URL of a random stock business image |
| `{{$randomCatsImage}}` | A URL of a random cat image |
| `{{$randomCityImage}}` | A URL of a random city image |
| `{{$randomFoodImage}}` | A URL of a random food image |
| `{{$randomNightlifeImage}}` | A URL of a random nightlife image |
| `{{$randomFashionImage}}` | A URL of a random fashion image |
| `{{$randomPeopleImage}}` | A URL of a random image of a person |
| `{{$randomNatureImage}}` | A URL of a random nature image |
| `{{$randomSportsImage}}` | A URL of a random sports image |
| `{{$randomTransportImage}}` | A URL of a random transportation image |
| `{{$randomImageDataUri}}` | A random image data URI |

### Finance

| Variable | Description |
| --- | --- |
| `{{$randomBankAccount}}` | A random 8-digit bank account number |
| `{{$randomBankAccountName}}` | A random bank account name |
| `{{$randomCreditCardMask}}` | A random masked credit card number |
| `{{$randomBankAccountBic}}` | A random BIC (Bank Identifier Code) |
| `{{$randomBankAccountIban}}` | A random 15-31 character IBAN (International Bank Account Number) |
| `{{$randomTransactionType}}` | A random transaction type |
| `{{$randomCurrencyCode}}` | A random 3-letter currency code (ISO-4217) |
| `{{$randomCurrencyName}}` | A random currency name |
| `{{$randomCurrencySymbol}}` | A random currency symbol |
| `{{$randomBitcoin}}` | A random bitcoin address |

### Business

| Variable | Description |
| --- | --- |
| `{{$randomCompanyName}}` | A random company name |
| `{{$randomCompanySuffix}}` | A random company suffix |
| `{{$randomBs}}` | A random phrase of business-speak |
| `{{$randomBsAdjective}}` | A random business-speak adjective |
| `{{$randomBsBuzz}}` | A random business-speak buzzword |
| `{{$randomBsNoun}}` | A random business-speak noun |

### Catchphrases

| Variable | Description |
| --- | --- |
| `{{$randomCatchPhrase}}` | A random catchphrase |
| `{{$randomCatchPhraseAdjective}}` | A random catchphrase adjective |
| `{{$randomCatchPhraseDescriptor}}` | A random catchphrase descriptor |
| `{{$randomCatchPhraseNoun}}` | A random catchphrase noun |

### Databases

| Variable | Description |
| --- | --- |
| `{{$randomDatabaseColumn}}` | A random database column name |
| `{{$randomDatabaseType}}` | A random database type |
| `{{$randomDatabaseCollation}}` | A random database collation |
| `{{$randomDatabaseEngine}}` | A random database engine |

### Dates

| Variable | Description |
| --- | --- |
| `{{$randomDateFuture}}` | A random future datetime |
| `{{$randomDatePast}}` | A random past datetime |
| `{{$randomDateRecent}}` | A random recent datetime |
| `{{$randomWeekday}}` | A random weekday |
| `{{$randomMonth}}` | A random month |

### Domains, emails, and usernames

| Variable | Description |
| --- | --- |
| `{{$randomDomainName}}` | A random domain name |
| `{{$randomDomainSuffix}}` | A random domain suffix |
| `{{$randomDomainWord}}` | A random unqualified domain name |
| `{{$randomEmail}}` | A random email address |
| `{{$randomExampleEmail}}` | A random email address from an example domain |
| `{{$randomUserName}}` | A random username |
| `{{$randomUrl}}` | A random URL |

### Files and directories

| Variable | Description |
| --- | --- |
| `{{$randomFileName}}` | A random file name (includes uncommon extensions) |
| `{{$randomFileType}}` | A random file type (includes uncommon file types) |
| `{{$randomFileExt}}` | A random file extension (includes uncommon extensions) |
| `{{$randomCommonFileName}}` | A random file name |
| `{{$randomCommonFileType}}` | A random, common file type |
| `{{$randomCommonFileExt}}` | A random, common file extension |
| `{{$randomFilePath}}` | A random file path |
| `{{$randomDirectoryPath}}` | A random directory path |
| `{{$randomMimeType}}` | A random MIME type |

### Commerce

| Variable | Description |
| --- | --- |
| `{{$randomPrice}}` | A random price between 0.00 and 1000.00 |
| `{{$randomProduct}}` | A random product |
| `{{$randomProductAdjective}}` | A random product adjective |
| `{{$randomProductMaterial}}` | A random product material |
| `{{$randomProductName}}` | A random product name |
| `{{$randomDepartment}}` | A random commerce department |

### Grammar

| Variable | Description |
| --- | --- |
| `{{$randomNoun}}` | A random noun |
| `{{$randomVerb}}` | A random verb |
| `{{$randomIngverb}}` | A random verb ending in `-ing` |
| `{{$randomAdjective}}` | A random adjective |
| `{{$randomWord}}` | A random word |
| `{{$randomWords}}` | Some random words |
| `{{$randomPhrase}}` | A random phrase |

### Lorem ipsum

| Variable | Description |
| --- | --- |
| `{{$randomLoremWord}}` | A random word of lorem ipsum text |
| `{{$randomLoremWords}}` | Some random words of lorem ipsum text |
| `{{$randomLoremSentence}}` | A random sentence of lorem ipsum text |
| `{{$randomLoremSentences}}` | A random 2 to 6 sentences of lorem ipsum text |
| `{{$randomLoremParagraph}}` | A random paragraph of lorem ipsum text |
| `{{$randomLoremParagraphs}}` | 3 random paragraphs of lorem ipsum text |
| `{{$randomLoremText}}` | A random amount of lorem ipsum text |
| `{{$randomLoremSlug}}` | A random lorem ipsum URL slug |
| `{{$randomLoremLines}}` | 1 to 5 random lines of lorem ipsum |
