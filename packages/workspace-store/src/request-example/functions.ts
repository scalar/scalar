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
const randomPhoneNumberExt = () => `${faker.number.int({ min: 10, max: 99 })}-${faker.phone.number()}`

// --- Finance ---
const randomCreditCardMask = () => `**** **** **** ${faker.string.numeric({ length: 4 })}`

// Default context functions to generate random data
export const contextFunctions = {
  //---------------------------------- Common ----------------------------------
  $guid: {
    fn: faker.string.uuid,
    comment: 'A uuid-v4 style guid',
  },
  $timestamp: {
    fn: () => Math.floor(Date.now() / 1000).toString(),
    comment: 'The current UNIX timestamp in seconds',
  },
  $isoTimestamp: {
    fn: () => new Date().toISOString(),
    comment: 'The current ISO timestamp at zero UTC',
  },
  $randomUUID: {
    fn: faker.string.uuid,
    comment: 'A random 36-character UUID',
  },

  // ---------------------------------- Text, numbers and colors ----------------------------------
  $randomAlphaNumeric: {
    fn: () => faker.string.alphanumeric(1),
    comment: 'A random alpha-numeric character',
  },
  $randomBoolean: {
    fn: () => faker.datatype.boolean().toString(),
    comment: 'A random boolean value',
  },
  $randomInt: {
    fn: () => faker.number.int({ min: 0, max: 1000 }).toString(),
    comment: 'A random integer between 0 and 1000',
  },
  $randomColor: {
    fn: () => faker.color.rgb({ format: 'hex' }),
    comment: 'A random color in hex format',
  },
  $randomHexColor: {
    fn: () => faker.string.hexadecimal({ length: 6, prefix: '#' }),
    comment: 'A random hex value',
  },
  $randomAbbreviation: {
    fn: () => faker.hacker.abbreviation(),
    comment: 'A random abbreviation',
  },

  // ---------------------------------- Internet and IP addresses ----------------------------------
  $randomIP: {
    fn: () => faker.internet.ipv4(),
    comment: 'A random IPv4 address',
  },
  $randomIPV6: {
    fn: () => faker.internet.ipv6(),
    comment: 'A random IPv6 address',
  },
  $randomMACAddress: {
    fn: () => faker.internet.mac(),
    comment: 'A random MAC address',
  },
  $randomPassword: {
    fn: () => faker.string.alphanumeric({ length: 15 }),
    comment: 'A random 15-character alpha-numeric password',
  },
  $randomLocale: {
    fn: () => faker.location.language().alpha2,
    comment: 'A random two-letter language code (ISO 639-1)',
  },
  $randomUserAgent: {
    fn: () => faker.internet.userAgent(),
    comment: 'A random user agent',
  },
  $randomProtocol: {
    fn: () => faker.internet.protocol(),
    comment: 'A random internet protocol',
  },
  $randomSemver: {
    fn: () => faker.system.semver(),
    comment: 'A random semantic version number',
  },

  // ---------------------------------- Names ----------------------------------
  $randomFirstName: {
    fn: () => faker.person.firstName(),
    comment: 'A random first name',
  },
  $randomLastName: {
    fn: () => faker.person.lastName(),
    comment: 'A random last name',
  },
  $randomFullName: {
    fn: () => faker.person.fullName(),
    comment: 'A random first and last name',
  },
  $randomNamePrefix: {
    fn: () => faker.person.prefix(),
    comment: 'A random name prefix',
  },
  $randomNameSuffix: {
    fn: () => faker.person.suffix(),
    comment: 'A random name suffix',
  },

  // ---------------------------------- Profession ----------------------------------
  $randomJobArea: {
    fn: () => faker.person.jobArea(),
    comment: 'A random job area',
  },
  $randomJobDescriptor: {
    fn: () => faker.person.jobDescriptor(),
    comment: 'A random job descriptor',
  },
  $randomJobTitle: {
    fn: () => faker.person.jobTitle(),
    comment: 'A random job title',
  },
  $randomJobType: {
    fn: () => faker.person.jobType(),
    comment: 'A random job type',
  },

  // ---------------------------------- Phone, address, and location ----------------------------------
  $randomPhoneNumber: {
    fn: () => faker.phone.number({ style: 'national' }),
    comment: 'A random ten-digit phone number',
  },
  $randomPhoneNumberExt: {
    fn: randomPhoneNumberExt,
    comment: 'A random phone number prefixed with a two-digit extension (10–99)',
  },
  $randomCity: {
    fn: () => faker.location.city(),
    comment: 'A random city name',
  },
  $randomStreetName: {
    fn: () => faker.location.street(),
    comment: 'A random street name',
  },
  $randomStreetAddress: {
    fn: () => faker.location.streetAddress(),
    comment: 'A random street address',
  },
  $randomCountry: {
    fn: () => faker.location.country(),
    comment: 'A random country',
  },
  $randomCountryCode: {
    fn: () => faker.location.countryCode('alpha-2'),
    comment: 'A random two-letter country code (ISO 3166-1 alpha-2)',
  },
  $randomLatitude: {
    fn: () => faker.location.latitude().toString(),
    comment: 'A random latitude coordinate',
  },
  $randomLongitude: {
    fn: () => faker.location.longitude().toString(),
    comment: 'A random longitude coordinate',
  },

  // ---------------------------------- Images ----------------------------------
  $randomAvatarImage: {
    fn: () => faker.image.avatar(),
    comment: 'A random avatar image',
  },
  $randomImageUrl: {
    fn: () => faker.image.url(),
    comment: 'A URL of a random image',
  },
  $randomAbstractImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'abstract' }),
    comment: 'A URL of a random abstract image',
  },
  $randomAnimalsImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'animals' }),
    comment: 'A URL of a random animal image',
  },
  $randomBusinessImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'business' }),
    comment: 'A URL of a random stock business image',
  },
  $randomCatsImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'cat' }),
    comment: 'A URL of a random cat image',
  },
  $randomCityImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'city' }),
    comment: 'A URL of a random city image',
  },
  $randomFoodImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'food' }),
    comment: 'A URL of a random food image',
  },
  $randomNightlifeImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'nightlife' }),
    comment: 'A URL of a random nightlife image',
  },
  $randomFashionImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'fashion' }),
    comment: 'A URL of a random fashion image',
  },
  $randomPeopleImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'people' }),
    comment: 'A URL of a random image of a person',
  },
  $randomNatureImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'nature' }),
    comment: 'A URL of a random nature image',
  },
  $randomSportsImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'sports' }),
    comment: 'A URL of a random sports image',
  },
  $randomTransportImage: {
    fn: () => faker.image.urlLoremFlickr({ category: 'transport' }),
    comment: 'A URL of a random transportation image',
  },
  $randomImageDataUri: {
    fn: () => faker.image.dataUri(),
    comment: 'A random image data URI',
  },

  // ---------------------------------- Finance ----------------------------------
  $randomBankAccount: {
    fn: () => faker.finance.accountNumber(),
    comment: 'A random 8-digit bank account number',
  },
  $randomBankAccountName: {
    fn: () => faker.finance.accountName(),
    comment: 'A random bank account name',
  },
  $randomCreditCardMask: {
    fn: randomCreditCardMask,
    comment: 'A random masked credit card number',
  },
  $randomBankAccountBic: {
    fn: () => faker.finance.bic(),
    comment: 'A random BIC (Bank Identifier Code)',
  },
  $randomBankAccountIban: {
    fn: () => faker.finance.iban({ formatted: false }),
    comment: 'A random 15-31 character IBAN (International Bank Account Number)',
  },
  $randomTransactionType: {
    fn: () => faker.finance.transactionType(),
    comment: 'A random transaction type',
  },
  $randomCurrencyCode: {
    fn: () => faker.finance.currencyCode(),
    comment: 'A random 3-letter currency code (ISO-4217)',
  },
  $randomCurrencyName: {
    fn: () => faker.finance.currencyName(),
    comment: 'A random currency name',
  },
  $randomCurrencySymbol: {
    fn: () => faker.finance.currencySymbol(),
    comment: 'A random currency symbol',
  },
  $randomBitcoin: {
    fn: () => faker.finance.bitcoinAddress(),
    comment: 'A random bitcoin address',
  },

  // ---------------------------------- Business ----------------------------------
  $randomCompanyName: {
    fn: () => faker.company.name(),
    comment: 'A random company name',
  },
  $randomCompanySuffix: {
    fn: randomCompanySuffix,
    comment: 'A random company suffix',
  },
  $randomBs: {
    fn: () => faker.company.buzzPhrase(),
    comment: 'A random phrase of business-speak',
  },
  $randomBsAdjective: {
    fn: () => faker.company.buzzAdjective(),
    comment: 'A random business-speak adjective',
  },
  $randomBsBuzz: {
    fn: () => faker.company.buzzVerb(),
    comment: 'A random business-speak buzzword',
  },
  $randomBsNoun: {
    fn: () => faker.company.buzzNoun(),
    comment: 'A random business-speak noun',
  },

  // ---------------------------------- Catchphrases ----------------------------------
  $randomCatchPhrase: {
    fn: () => faker.company.catchPhrase(),
    comment: 'A random catchphrase',
  },
  $randomCatchPhraseAdjective: {
    fn: () => faker.company.catchPhraseAdjective(),
    comment: 'A random catchphrase adjective',
  },
  $randomCatchPhraseDescriptor: {
    fn: () => faker.company.catchPhraseDescriptor(),
    comment: 'A random catchphrase descriptor',
  },
  $randomCatchPhraseNoun: {
    fn: () => faker.company.catchPhraseNoun(),
    comment: 'Randomly generates a catchphrase noun',
  },

  // ---------------------------------- Databases ----------------------------------
  $randomDatabaseColumn: {
    fn: () => faker.database.column(),
    comment: 'A random database column name',
  },
  $randomDatabaseType: {
    fn: () => faker.database.type(),
    comment: 'A random database type',
  },
  $randomDatabaseCollation: {
    fn: () => faker.database.collation(),
    comment: 'A random database collation',
  },
  $randomDatabaseEngine: {
    fn: () => faker.database.engine(),
    comment: 'A random database engine',
  },

  // ---------------------------------- Dates ----------------------------------
  $randomDateFuture: {
    fn: () => faker.date.future().toISOString(),
    comment: 'A random future datetime',
  },
  $randomDatePast: {
    fn: () => faker.date.past().toISOString(),
    comment: 'A random past datetime',
  },
  $randomDateRecent: {
    fn: () => faker.date.recent().toISOString(),
    comment: 'A random recent datetime',
  },
  $randomWeekday: {
    fn: () => faker.date.weekday(),
    comment: 'A random weekday',
  },
  $randomMonth: {
    fn: () => faker.date.month(),
    comment: 'A random month',
  },

  // ---------------------------------- Domains, emails, and usernames ----------------------------------
  $randomDomainName: {
    fn: () => faker.internet.domainName(),
    comment: 'A random domain name',
  },
  $randomDomainSuffix: {
    fn: () => faker.internet.domainSuffix(),
    comment: 'A random domain suffix',
  },
  $randomDomainWord: {
    fn: () => faker.internet.domainWord(),
    comment: 'A random unqualified domain name',
  },
  $randomEmail: {
    fn: () => faker.internet.email(),
    comment: 'A random email address',
  },
  $randomExampleEmail: {
    fn: () => faker.internet.exampleEmail(),
    comment: 'A random email address from an example domain',
  },
  $randomUserName: {
    fn: () => faker.internet.username(),
    comment: 'A random username',
  },
  $randomUrl: {
    fn: () => faker.internet.url(),
    comment: 'A random URL',
  },

  // ---------------------------------- Files and directories ----------------------------------
  $randomFileName: {
    fn: () => faker.system.fileName(),
    comment: 'A random file name (includes uncommon extensions)',
  },
  $randomFileType: {
    fn: () => faker.system.fileType(),
    comment: 'A random file type (includes uncommon file types)',
  },
  $randomFileExt: {
    fn: () => faker.system.fileExt(),
    comment: 'A random file extension (includes uncommon extensions)',
  },
  $randomCommonFileName: {
    fn: () => faker.system.commonFileName(),
    comment: 'A random file name',
  },
  $randomCommonFileType: {
    fn: () => faker.system.commonFileType(),
    comment: 'A random, common file type',
  },
  $randomCommonFileExt: {
    fn: () => faker.system.commonFileExt(),
    comment: 'A random, common file extension',
  },
  $randomFilePath: {
    fn: () => faker.system.filePath(),
    comment: 'A random file path',
  },
  $randomDirectoryPath: {
    fn: () => faker.system.directoryPath(),
    comment: 'A random directory path',
  },
  $randomMimeType: {
    fn: () => faker.system.mimeType(),
    comment: 'A random MIME type',
  },

  // ---------------------------------- Stores ----------------------------------
  $randomPrice: {
    fn: () => faker.commerce.price({ min: 0.0, max: 1000.0 }),
    comment: 'A random price between 0.00 and 1000.00',
  },
  $randomProduct: {
    fn: () => faker.commerce.product(),
    comment: 'A random product',
  },
  $randomProductAdjective: {
    fn: () => faker.commerce.productAdjective(),
    comment: 'A random product adjective',
  },
  $randomProductMaterial: {
    fn: () => faker.commerce.productMaterial(),
    comment: 'A random product material',
  },
  $randomProductName: {
    fn: () => faker.commerce.productName(),
    comment: 'A random product name',
  },
  $randomDepartment: {
    fn: () => faker.commerce.department(),
    comment: 'A random commerce department',
  },

  // ---------------------------------- Grammar ----------------------------------
  $randomNoun: {
    fn: () => faker.word.noun(),
    comment: 'A random noun',
  },
  $randomVerb: {
    fn: () => faker.word.verb(),
    comment: 'A random verb',
  },
  $randomIngverb: {
    fn: randomIngVerb,
    comment: 'A random verb ending in `-ing`',
  },
  $randomAdjective: {
    fn: () => faker.word.adjective(),
    comment: 'A random adjective',
  },
  $randomWord: {
    fn: () => faker.word.words(1),
    comment: 'A random word',
  },
  $randomWords: {
    fn: () => faker.word.words({ count: { min: 2, max: 5 } }),
    comment: 'Some random words',
  },
  $randomPhrase: {
    fn: () => faker.company.buzzPhrase(),
    comment: 'A random phrase',
  },

  // ---------------------------------- Lorem ipsum ----------------------------------
  $randomLoremWord: {
    fn: () => faker.lorem.word(),
    comment: 'A random word of lorem ipsum text',
  },
  $randomLoremWords: {
    fn: () => faker.lorem.words(3),
    comment: 'Some random words of lorem ipsum text',
  },
  $randomLoremSentence: {
    fn: () => faker.lorem.sentence(),
    comment: 'A random sentence of lorem ipsum text',
  },
  $randomLoremSentences: {
    fn: () => faker.lorem.sentences({ min: 2, max: 6 }),
    comment: 'A random 2 to 6 sentences of lorem ipsum text',
  },
  $randomLoremParagraph: {
    fn: () => faker.lorem.paragraph(),
    comment: 'A random paragraph of lorem ipsum text',
  },
  $randomLoremParagraphs: {
    fn: () => faker.lorem.paragraphs(3),
    comment: '3 random paragraphs of lorem ipsum text',
  },
  $randomLoremText: {
    fn: () => faker.lorem.text(),
    comment: 'A random amount of lorem ipsum text',
  },
  $randomLoremSlug: {
    fn: () => faker.lorem.slug(),
    comment: 'A random lorem ipsum URL slug',
  },
  $randomLoremLines: {
    fn: () => faker.lorem.lines({ min: 1, max: 5 }),
    comment: '1 to 5 random lines of lorem ipsum',
  },
} satisfies Record<string, { fn: () => string; comment: string }>

/** Stable shape for each context function (the map is large; indexed access widens poorly for some consumers). */
export type ContextFunctionEntry = {
  fn: () => string
  comment: string
}

export type ContextFunctionName = keyof typeof contextFunctions

export const getContextFunctionComment = (name: ContextFunctionName): string =>
  (contextFunctions as Record<ContextFunctionName, ContextFunctionEntry>)[name].comment

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
