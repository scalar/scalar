import { faker } from '@faker-js/faker'

// --- Grammar ---
const randomIngVerb = () => {
  const verb = faker.word.verb() // e.g. "run", "make", "swim"
  return toIng(verb)
}
const toIng = (verb: string) => {
  // basic rules
  if (verb.endsWith('e') && verb !== 'be') {
    return verb.slice(0, -1) + 'ing' // make → making
  }

  // double consonant (very simplified)
  if (/[aeiou][bcdfghjklmnpqrstvwxyz]$/.test(verb)) {
    return verb + verb.slice(-1) + 'ing' // run → running
  }

  return verb + 'ing'
}

// --- Company ---
const suffixes = ['Inc', 'LLC', 'Group', 'Ltd', 'PLC', 'Corp']
const randomCompanySuffix = () => faker.helpers.arrayElement(suffixes)

// --- Phone ---
const randomPhoneNumberExt = () => `${faker.number.int(2)}-${faker.phone.number()}`

// --- Finance ---
const randomCreditCardMask = () => `**** **** **** ${faker.string.numeric({ length: 4 })}`

// Default context functions to generate random data
export const contextFunctions = {
  //---------------------------------- Common ----------------------------------
  // 	A uuid-v4 style guid
  $guid: faker.string.uuid,
  // The current UNIX timestamp in seconds
  $timestamp: () => Math.floor(Date.now() / 1000).toString(),
  // The current ISO timestamp at zero UTC
  $isoTimestamp: () => new Date().toISOString(),
  // A random 36-character UUID
  $randomUUID: faker.string.uuid,

  // ---------------------------------- Text, numbers and colors ----------------------------------
  // A random alpha-numeric character
  $randomAlphaNumeric: () => faker.string.alphanumeric(1),
  // A random boolean value
  $randomBoolean: () => faker.datatype.boolean().toString(),
  // A random integer between 0 and 1000
  $randomInt: () => faker.number.int({ min: 0, max: 1000 }).toString(),
  // A random color in hex format
  $randomColor: () => faker.color.rgb({ format: 'hex' }),
  // A random hex value
  $randomHexColor: () => faker.string.hexadecimal({ length: 6, prefix: '#' }),
  // A random abbreviation
  $randomAbbreviation: faker.hacker.abbreviation,

  // ---------------------------------- Internet and IP addresses ----------------------------------
  // A random IPv4 address
  $randomIP: faker.internet.ipv4,
  // 	A random IPv6 address
  $randomIPV6: faker.internet.ipv6,
  // A random MAC address
  $randomMACAddress: faker.internet.mac,
  // A random 15-character alpha-numeric password
  $randomPassword: () => faker.string.alphanumeric({ length: 15 }),
  // A random two-letter language code (ISO 639-1)
  $randomLocale: () => faker.location.language().alpha2,
  // A random user agent
  $randomUserAgent: faker.internet.userAgent,
  // A random internet protocol
  $randomProtocol: faker.internet.protocol,
  // A random semantic version number
  $randomSemver: faker.system.semver,

  // ---------------------------------- Names ----------------------------------
  // A random first name
  $randomFirstName: faker.person.firstName,
  // A random last name
  $randomLastName: faker.person.lastName,
  // A random first and last name
  $randomFullName: faker.person.fullName,
  // A random name prefix
  $randomNamePrefix: faker.person.prefix,
  // A random name suffix
  $randomNameSuffix: faker.person.suffix,

  // ---------------------------------- Profession ----------------------------------
  // A random job area
  $randomJobArea: faker.person.jobArea,
  // A random job descriptor
  $randomJobDescriptor: faker.person.jobDescriptor,
  // A random job title
  $randomJobTitle: faker.person.jobTitle,
  // A random job type
  randomJobType: faker.person.jobType,

  // ---------------------------------- Phone, address, and location ----------------------------------
  // A random ten-digit phone number
  $randomPhoneNumber: () => faker.phone.number({ style: 'national' }),
  // A random phone number with extension (12 digits)
  $randomPhoneNumberExt: randomPhoneNumberExt,
  // 	A random city name
  $randomCity: faker.location.city,
  // 	A random street name
  $randomStreetName: faker.location.street,
  // 	A random street address
  $randomStreetAddress: faker.location.streetAddress,
  // A random country
  $randomCountry: faker.location.country,
  // A random two-letter country code (ISO 3166-1 alpha-2)
  $randomCountryCode: () => faker.location.countryCode('alpha-2'),
  // A random latitude coordinate
  $randomLatitude: () => faker.location.latitude().toString(),
  // A random longitude coordinate
  $randomLongitude: () => faker.location.longitude().toString(),

  // ---------------------------------- Images ----------------------------------
  // A random avatar image
  $randomAvatarImage: () => faker.image.avatar(),
  // A URL of a random image
  $randomImageUrl: () => faker.image.url(),
  // A URL of a random abstract image
  $randomAbstractImage: () => faker.image.urlLoremFlickr({ category: 'abstract' }),
  // A URL of a random animal image
  $randomAnimalsImage: () => faker.image.urlLoremFlickr({ category: 'animals' }),
  // A URL of a random stock business image
  $randomBusinessImage: () => faker.image.urlLoremFlickr({ category: 'business' }),
  // A URL of a random cat image
  $randomCatsImage: () => faker.image.urlLoremFlickr({ category: 'cat' }),
  // A URL of a random city image
  $randomCityImage: () => faker.image.urlLoremFlickr({ category: 'city' }),
  // A URL of a random food image
  $randomFoodImage: () => faker.image.urlLoremFlickr({ category: 'food' }),
  // A URL of a random nightlife image
  $randomNightlifeImage: () => faker.image.urlLoremFlickr({ category: 'nightlife' }),
  // A URL of a random fashion image
  $randomFashionImage: () => faker.image.urlLoremFlickr({ category: 'fashion' }),
  // A URL of a random image of a person
  $randomPeopleImage: () => faker.image.urlLoremFlickr({ category: 'people' }),
  // A URL of a random nature image
  $randomNatureImage: () => faker.image.urlLoremFlickr({ category: 'nature' }),
  // A URL of a random sports image
  $randomSportsImage: () => faker.image.urlLoremFlickr({ category: 'sports' }),
  // A URL of a random transportation image
  $randomTransportImage: () => faker.image.urlLoremFlickr({ category: 'transport' }),
  // A random image data URI
  $randomImageDataUri: () => faker.image.dataUri(),

  // ---------------------------------- Finance ----------------------------------
  // A random 8-digit bank account number
  $randomBankAccount: faker.finance.accountNumber,
  // 	A random bank account name
  $randomBankAccountName: faker.finance.accountName,
  // A random masked credit card number
  $randomCreditCardMask: randomCreditCardMask,
  // A random BIC (Bank Identifier Code)
  $randomBankAccountBic: faker.finance.bic,
  // A random 15-31 character IBAN (International Bank Account Number)
  $randomBankAccountIban: () => faker.finance.iban({ formatted: false }),
  // 	A random transaction type
  $randomTransactionType: faker.finance.transactionType,
  // A random 3-letter currency code (ISO-4217)
  $randomCurrencyCode: faker.finance.currencyCode,
  // A random currency name
  $randomCurrencyName: faker.finance.currencyName,
  // A random currency symbol
  $randomCurrencySymbol: faker.finance.currencySymbol,
  // A random bitcoin address
  $randomBitcoin: faker.finance.bitcoinAddress,

  // ---------------------------------- Business ----------------------------------
  // A random company name
  $randomCompanyName: faker.company.name,
  // A random company suffix
  $randomCompanySuffix: randomCompanySuffix,
  // A random phrase of business-speak
  $randomBs: faker.company.buzzPhrase,
  // A random business-speak adjective
  $randomBsAdjective: faker.company.buzzAdjective,
  // A random business-speak buzzword
  $randomBsBuzz: faker.company.buzzVerb,
  // 	A random business-speak noun
  $randomBsNoun: faker.company.buzzNoun,

  // ---------------------------------- Catchphrases ----------------------------------
  // A random catchphrase
  $randomCatchPhrase: faker.company.catchPhrase,
  // A random catchphrase adjective
  $randomCatchPhraseAdjective: faker.company.catchPhraseAdjective,
  // A random catchphrase descriptor
  $randomCatchPhraseDescriptor: faker.company.catchPhraseDescriptor,
  // Randomly generates a catchphrase noun
  $randomCatchPhraseNoun: faker.company.catchPhraseNoun,

  // ---------------------------------- Databases ----------------------------------
  //	A random database column name
  $randomDatabaseColumn: faker.database.column,
  // A random database type
  $randomDatabaseType: faker.database.type,
  // A random database collation
  $randomDatabaseCollation: faker.database.collation,
  // A random database engine
  $randomDatabaseEngine: faker.database.engine,

  // ---------------------------------- Dates ----------------------------------
  // A random future datetime
  $randomDateFuture: () => faker.date.future().toISOString(),
  // 	A random past datetime
  $randomDatePast: () => faker.date.past().toISOString(),
  // A random recent datetime
  $randomDateRecent: () => faker.date.recent().toISOString(),
  // A random weekday
  $randomWeekday: faker.date.weekday,
  // A random month
  $randomMonth: faker.date.month,

  // ---------------------------------- Domains, emails, and usernames ----------------------------------
  // A random domain name
  $randomDomainName: faker.internet.domainName,
  // 	A random domain suffix
  $randomDomainSuffix: faker.internet.domainSuffix,
  // A random unqualified domain name
  $randomDomainWord: faker.internet.domainWord,
  // A random email address
  $randomEmail: faker.internet.email,
  // A random email address from an “example” domain
  $randomExampleEmail: faker.internet.exampleEmail,
  // 	A random username
  $randomUserName: faker.internet.username,
  // A random URL
  $randomUrl: faker.internet.url,

  // ---------------------------------- Files and directories ----------------------------------
  // 	A random file name (includes uncommon extensions)
  $randomFileName: faker.system.fileName,
  // A random file type (includes uncommon file types)
  $randomFileType: faker.system.fileType,
  // A random file extension (includes uncommon extensions)
  $randomFileExt: faker.system.fileExt,
  // A random file name
  $randomCommonFileName: faker.system.commonFileName,
  // A random, common file type
  $randomCommonFileType: faker.system.commonFileType,
  // A random, common file extension
  $randomCommonFileExt: faker.system.commonFileExt,
  // A random file path
  $randomFilePath: faker.system.filePath,
  // A random directory path
  $randomDirectoryPath: faker.system.directoryPath,
  // A random MIME type
  $randomMimeType: faker.system.mimeType,

  // ---------------------------------- Stores ----------------------------------
  // A random price between 0.00 and 1000.00
  $randomPrice: () => faker.commerce.price({ min: 0.0, max: 1000.0 }),
  // A random product
  $randomProduct: faker.commerce.product,
  // A random product adjective
  $randomProductAdjective: faker.commerce.productAdjective,
  // 	A random product material
  $randomProductMaterial: faker.commerce.productMaterial,
  // A random product name
  $randomProductName: faker.commerce.productName,
  // A random commerce department
  $randomDepartment: faker.commerce.department,

  // ---------------------------------- Grammar ----------------------------------
  // A random noun
  $randomNoun: faker.word.noun,
  // A random verb
  $randomVerb: faker.word.verb,
  // A random verb ending in `-ing`
  $randomIngverb: randomIngVerb,
  // 	A random adjective
  $randomAdjective: faker.word.adjective,
  // A random word
  $randomWord: () => faker.word.words(1),
  // Some random words
  $randomWords: () => faker.word.words({ count: { min: 2, max: 5 } }),
  // A random phrase
  $randomPhrase: faker.company.buzzPhrase,

  // ---------------------------------- Lorem ipsum ----------------------------------
  // A random word of lorem ipsum text
  $randomLoremWord: faker.lorem.word,
  // Some random words of lorem ipsum text
  $randomLoremWords: () => faker.lorem.words(3),
  // A random sentence of lorem ipsum text
  $randomLoremSentence: faker.lorem.sentence,
  // A random 2 to 6 sentences of lorem ipsum text
  $randomLoremSentences: () => faker.lorem.sentences({ min: 2, max: 6 }),
  // A random paragraph of lorem ipsum text
  $randomLoremParagraph: faker.lorem.paragraph,
  // 3 random paragraphs of lorem ipsum text
  $randomLoremParagraphs: () => faker.lorem.paragraphs(3),
  // A random amount of lorem ipsum text
  $randomLoremText: faker.lorem.text,
  // 	A random lorem ipsum URL slug
  $randomLoremSlug: faker.lorem.slug,
  // 1 to 5 random lines of lorem ipsum
  $randomLoremLines: () => faker.lorem.lines({ min: 1, max: 5 }),
} satisfies Record<string, () => string>

export type ContextFunctionName = keyof typeof contextFunctions

/** Keys surfaced first in empty-query autocomplete (common request placeholders). */
export const POPULAR_CONTEXT_FUNCTION_KEYS: readonly ContextFunctionName[] = [
  '$guid',
  '$timestamp',
  '$isoTimestamp',
  '$randomUUID',
  '$randomEmail',
  '$randomInt',
  '$randomFirstName',
  '$randomLastName',
]

export const CONTEXT_FUNCTION_NAMES = Object.keys(contextFunctions) as ContextFunctionName[]
export const isContextFunctionName = (name: string): name is ContextFunctionName =>
  Object.hasOwn(contextFunctions, name)
