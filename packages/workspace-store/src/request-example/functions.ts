import {
  abbreviations,
  abstractImageUrls,
  adjectives,
  alphanumericChars,
  animalsImageUrls,
  avatarUrls,
  bankAccountNames,
  bankAccountNumbers,
  bicCodes,
  bitcoinAddresses,
  businessImageUrls,
  buzzAdjectives,
  buzzNouns,
  buzzPhrases,
  buzzVerbs,
  catchPhraseAdjectives,
  catchPhraseDescriptors,
  catchPhraseNouns,
  catchPhrases,
  catsImageUrls,
  cities,
  cityImageUrls,
  commonFileExtensions,
  commonFileNames,
  commonFileTypes,
  companyNames,
  companySuffixes,
  countries,
  countryCodes,
  currencyCodes,
  currencyNames,
  currencySymbols,
  dataUris,
  databaseCollations,
  databaseColumns,
  databaseEngines,
  databaseTypes,
  departments,
  directoryPaths,
  domainNames,
  domainSuffixes,
  domainWords,
  emails,
  exampleEmails,
  fashionImageUrls,
  fileExtensions,
  fileNames,
  filePaths,
  fileTypes,
  firstNames,
  foodImageUrls,
  hexColors,
  ibanNumbers,
  imageUrls,
  ingVerbs,
  ipv4Addresses,
  ipv6Addresses,
  jobAreas,
  jobDescriptors,
  jobTitles,
  jobTypes,
  lastNames,
  latitudes,
  locales,
  longitudes,
  loremParagraphs,
  loremSentences,
  loremSlugs,
  loremWords,
  macAddresses,
  mimeTypes,
  months,
  namePrefixes,
  nameSuffixes,
  natureImageUrls,
  nightlifeImageUrls,
  nouns,
  peopleImageUrls,
  phoneNumbers,
  productAdjectives,
  productMaterials,
  productNames,
  products,
  protocols,
  semvers,
  sportsImageUrls,
  streetAddresses,
  streetNames,
  transactionTypes,
  transportImageUrls,
  urls,
  userAgents,
  usernames,
  uuids,
  verbs,
  weekdays,
  words,
} from './random-data'

/** Pick a random element from a non-empty pre-generated pool. */
// All pools are hardcoded non-empty arrays, so the index is always valid.
const pick = <T>(pool: readonly T[]): T => pool[Math.floor(Math.random() * pool.length)]!

/** Generate a random integer in [min, max]. */
const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

/** Generate a random numeric string of the given length. */
const numericString = (length: number): string => Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')

/** Generate a random alphanumeric string of the given length. */
const alphanumeric = (length: number): string =>
  Array.from({ length }, () => alphanumericChars[Math.floor(Math.random() * alphanumericChars.length)]).join('')

/** Generate a future ISO timestamp (1–365 days from now). */
const futureDate = (): string => {
  const ms = Date.now() + randInt(1, 365) * 86_400_000
  return new Date(ms).toISOString()
}

/** Generate a past ISO timestamp (1–365 days ago). */
const pastDate = (): string => {
  const ms = Date.now() - randInt(1, 365) * 86_400_000
  return new Date(ms).toISOString()
}

/** Generate a recent ISO timestamp (1–3 days ago). */
const recentDate = (): string => {
  const ms = Date.now() - randInt(1, 3) * 86_400_000
  return new Date(ms).toISOString()
}

/** Pick N random words from a pool and join them. */
const pickWords = (pool: readonly string[], min: number, max: number): string => {
  const count = randInt(min, max)
  return Array.from({ length: count }, () => pick(pool)).join(' ')
}

/** Pick N random sentences and join them. */
const pickSentences = (pool: readonly string[], min: number, max: number): string => {
  const count = randInt(min, max)
  return Array.from({ length: count }, () => pick(pool)).join(' ')
}

/** Pick N random lines (sentences) and join with newlines. */
const pickLines = (pool: readonly string[], min: number, max: number): string => {
  const count = randInt(min, max)
  return Array.from({ length: count }, () => pick(pool)).join('\n')
}

export const contextFunctions = {
  //---------------------------------- Common ----------------------------------
  $guid: {
    fn: () => pick(uuids),
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
    fn: () => pick(uuids),
    comment: 'A random 36-character UUID',
  },

  // ---------------------------------- Text, numbers and colors ----------------------------------
  $randomAlphaNumeric: {
    fn: () => alphanumericChars[Math.floor(Math.random() * alphanumericChars.length)] ?? 'a',
    comment: 'A random alpha-numeric character',
  },
  $randomBoolean: {
    fn: () => (Math.random() < 0.5 ? 'true' : 'false'),
    comment: 'A random boolean value',
  },
  $randomInt: {
    fn: () => randInt(0, 1000).toString(),
    comment: 'A random integer between 0 and 1000',
  },
  $randomColor: {
    fn: () => pick(hexColors),
    comment: 'A random color in hex format',
  },
  $randomHexColor: {
    fn: () => pick(hexColors),
    comment: 'A random hex value',
  },
  $randomAbbreviation: {
    fn: () => pick(abbreviations),
    comment: 'A random abbreviation',
  },

  // ---------------------------------- Internet and IP addresses ----------------------------------
  $randomIP: {
    fn: () => pick(ipv4Addresses),
    comment: 'A random IPv4 address',
  },
  $randomIPV6: {
    fn: () => pick(ipv6Addresses),
    comment: 'A random IPv6 address',
  },
  $randomMACAddress: {
    fn: () => pick(macAddresses),
    comment: 'A random MAC address',
  },
  $randomPassword: {
    fn: () => alphanumeric(15),
    comment: 'A random 15-character alpha-numeric password',
  },
  $randomLocale: {
    fn: () => pick(locales),
    comment: 'A random two-letter language code (ISO 639-1)',
  },
  $randomUserAgent: {
    fn: () => pick(userAgents),
    comment: 'A random user agent',
  },
  $randomProtocol: {
    fn: () => pick(protocols),
    comment: 'A random internet protocol',
  },
  $randomSemver: {
    fn: () => pick(semvers),
    comment: 'A random semantic version number',
  },

  // ---------------------------------- Names ----------------------------------
  $randomFirstName: {
    fn: () => pick(firstNames),
    comment: 'A random first name',
  },
  $randomLastName: {
    fn: () => pick(lastNames),
    comment: 'A random last name',
  },
  $randomFullName: {
    fn: () => `${pick(firstNames)} ${pick(lastNames)}`,
    comment: 'A random first and last name',
  },
  $randomNamePrefix: {
    fn: () => pick(namePrefixes),
    comment: 'A random name prefix',
  },
  $randomNameSuffix: {
    fn: () => pick(nameSuffixes),
    comment: 'A random name suffix',
  },

  // ---------------------------------- Profession ----------------------------------
  $randomJobArea: {
    fn: () => pick(jobAreas),
    comment: 'A random job area',
  },
  $randomJobDescriptor: {
    fn: () => pick(jobDescriptors),
    comment: 'A random job descriptor',
  },
  $randomJobTitle: {
    fn: () => pick(jobTitles),
    comment: 'A random job title',
  },
  $randomJobType: {
    fn: () => pick(jobTypes),
    comment: 'A random job type',
  },

  // ---------------------------------- Phone, address, and location ----------------------------------
  $randomPhoneNumber: {
    fn: () => pick(phoneNumbers),
    comment: 'A random ten-digit phone number',
  },
  $randomPhoneNumberExt: {
    fn: () => `${randInt(10, 99)}-${pick(phoneNumbers)}`,
    comment: 'A random phone number prefixed with a two-digit extension (10–99)',
  },
  $randomCity: {
    fn: () => pick(cities),
    comment: 'A random city name',
  },
  $randomStreetName: {
    fn: () => pick(streetNames),
    comment: 'A random street name',
  },
  $randomStreetAddress: {
    fn: () => pick(streetAddresses),
    comment: 'A random street address',
  },
  $randomCountry: {
    fn: () => pick(countries),
    comment: 'A random country',
  },
  $randomCountryCode: {
    fn: () => pick(countryCodes),
    comment: 'A random two-letter country code (ISO 3166-1 alpha-2)',
  },
  $randomLatitude: {
    fn: () => pick(latitudes),
    comment: 'A random latitude coordinate',
  },
  $randomLongitude: {
    fn: () => pick(longitudes),
    comment: 'A random longitude coordinate',
  },

  // ---------------------------------- Images ----------------------------------
  $randomAvatarImage: {
    fn: () => pick(avatarUrls),
    comment: 'A random avatar image',
  },
  $randomImageUrl: {
    fn: () => pick(imageUrls),
    comment: 'A URL of a random image',
  },
  $randomAbstractImage: {
    fn: () => pick(abstractImageUrls),
    comment: 'A URL of a random abstract image',
  },
  $randomAnimalsImage: {
    fn: () => pick(animalsImageUrls),
    comment: 'A URL of a random animal image',
  },
  $randomBusinessImage: {
    fn: () => pick(businessImageUrls),
    comment: 'A URL of a random stock business image',
  },
  $randomCatsImage: {
    fn: () => pick(catsImageUrls),
    comment: 'A URL of a random cat image',
  },
  $randomCityImage: {
    fn: () => pick(cityImageUrls),
    comment: 'A URL of a random city image',
  },
  $randomFoodImage: {
    fn: () => pick(foodImageUrls),
    comment: 'A URL of a random food image',
  },
  $randomNightlifeImage: {
    fn: () => pick(nightlifeImageUrls),
    comment: 'A URL of a random nightlife image',
  },
  $randomFashionImage: {
    fn: () => pick(fashionImageUrls),
    comment: 'A URL of a random fashion image',
  },
  $randomPeopleImage: {
    fn: () => pick(peopleImageUrls),
    comment: 'A URL of a random image of a person',
  },
  $randomNatureImage: {
    fn: () => pick(natureImageUrls),
    comment: 'A URL of a random nature image',
  },
  $randomSportsImage: {
    fn: () => pick(sportsImageUrls),
    comment: 'A URL of a random sports image',
  },
  $randomTransportImage: {
    fn: () => pick(transportImageUrls),
    comment: 'A URL of a random transportation image',
  },
  $randomImageDataUri: {
    fn: () => pick(dataUris),
    comment: 'A random image data URI',
  },

  // ---------------------------------- Finance ----------------------------------
  $randomBankAccount: {
    fn: () => pick(bankAccountNumbers),
    comment: 'A random 8-digit bank account number',
  },
  $randomBankAccountName: {
    fn: () => pick(bankAccountNames),
    comment: 'A random bank account name',
  },
  $randomCreditCardMask: {
    fn: () => `**** **** **** ${numericString(4)}`,
    comment: 'A random masked credit card number',
  },
  $randomBankAccountBic: {
    fn: () => pick(bicCodes),
    comment: 'A random BIC (Bank Identifier Code)',
  },
  $randomBankAccountIban: {
    fn: () => pick(ibanNumbers),
    comment: 'A random 15-31 character IBAN (International Bank Account Number)',
  },
  $randomTransactionType: {
    fn: () => pick(transactionTypes),
    comment: 'A random transaction type',
  },
  $randomCurrencyCode: {
    fn: () => pick(currencyCodes),
    comment: 'A random 3-letter currency code (ISO-4217)',
  },
  $randomCurrencyName: {
    fn: () => pick(currencyNames),
    comment: 'A random currency name',
  },
  $randomCurrencySymbol: {
    fn: () => pick(currencySymbols),
    comment: 'A random currency symbol',
  },
  $randomBitcoin: {
    fn: () => pick(bitcoinAddresses),
    comment: 'A random bitcoin address',
  },

  // ---------------------------------- Business ----------------------------------
  $randomCompanyName: {
    fn: () => pick(companyNames),
    comment: 'A random company name',
  },
  $randomCompanySuffix: {
    fn: () => pick(companySuffixes),
    comment: 'A random company suffix',
  },
  $randomBs: {
    fn: () => pick(buzzPhrases),
    comment: 'A random phrase of business-speak',
  },
  $randomBsAdjective: {
    fn: () => pick(buzzAdjectives),
    comment: 'A random business-speak adjective',
  },
  $randomBsBuzz: {
    fn: () => pick(buzzVerbs),
    comment: 'A random business-speak buzzword',
  },
  $randomBsNoun: {
    fn: () => pick(buzzNouns),
    comment: 'A random business-speak noun',
  },

  // ---------------------------------- Catchphrases ----------------------------------
  $randomCatchPhrase: {
    fn: () => pick(catchPhrases),
    comment: 'A random catchphrase',
  },
  $randomCatchPhraseAdjective: {
    fn: () => pick(catchPhraseAdjectives),
    comment: 'A random catchphrase adjective',
  },
  $randomCatchPhraseDescriptor: {
    fn: () => pick(catchPhraseDescriptors),
    comment: 'A random catchphrase descriptor',
  },
  $randomCatchPhraseNoun: {
    fn: () => pick(catchPhraseNouns),
    comment: 'Randomly generates a catchphrase noun',
  },

  // ---------------------------------- Databases ----------------------------------
  $randomDatabaseColumn: {
    fn: () => pick(databaseColumns),
    comment: 'A random database column name',
  },
  $randomDatabaseType: {
    fn: () => pick(databaseTypes),
    comment: 'A random database type',
  },
  $randomDatabaseCollation: {
    fn: () => pick(databaseCollations),
    comment: 'A random database collation',
  },
  $randomDatabaseEngine: {
    fn: () => pick(databaseEngines),
    comment: 'A random database engine',
  },

  // ---------------------------------- Dates ----------------------------------
  $randomDateFuture: {
    fn: futureDate,
    comment: 'A random future datetime',
  },
  $randomDatePast: {
    fn: pastDate,
    comment: 'A random past datetime',
  },
  $randomDateRecent: {
    fn: recentDate,
    comment: 'A random recent datetime',
  },
  $randomWeekday: {
    fn: () => pick(weekdays),
    comment: 'A random weekday',
  },
  $randomMonth: {
    fn: () => pick(months),
    comment: 'A random month',
  },

  // ---------------------------------- Domains, emails, and usernames ----------------------------------
  $randomDomainName: {
    fn: () => pick(domainNames),
    comment: 'A random domain name',
  },
  $randomDomainSuffix: {
    fn: () => pick(domainSuffixes),
    comment: 'A random domain suffix',
  },
  $randomDomainWord: {
    fn: () => pick(domainWords),
    comment: 'A random unqualified domain name',
  },
  $randomEmail: {
    fn: () => pick(emails),
    comment: 'A random email address',
  },
  $randomExampleEmail: {
    fn: () => pick(exampleEmails),
    comment: 'A random email address from an example domain',
  },
  $randomUserName: {
    fn: () => pick(usernames),
    comment: 'A random username',
  },
  $randomUrl: {
    fn: () => pick(urls),
    comment: 'A random URL',
  },

  // ---------------------------------- Files and directories ----------------------------------
  $randomFileName: {
    fn: () => pick(fileNames),
    comment: 'A random file name (includes uncommon extensions)',
  },
  $randomFileType: {
    fn: () => pick(fileTypes),
    comment: 'A random file type (includes uncommon file types)',
  },
  $randomFileExt: {
    fn: () => pick(fileExtensions),
    comment: 'A random file extension (includes uncommon extensions)',
  },
  $randomCommonFileName: {
    fn: () => pick(commonFileNames),
    comment: 'A random file name',
  },
  $randomCommonFileType: {
    fn: () => pick(commonFileTypes),
    comment: 'A random, common file type',
  },
  $randomCommonFileExt: {
    fn: () => pick(commonFileExtensions),
    comment: 'A random, common file extension',
  },
  $randomFilePath: {
    fn: () => pick(filePaths),
    comment: 'A random file path',
  },
  $randomDirectoryPath: {
    fn: () => pick(directoryPaths),
    comment: 'A random directory path',
  },
  $randomMimeType: {
    fn: () => pick(mimeTypes),
    comment: 'A random MIME type',
  },

  // ---------------------------------- Stores ----------------------------------
  $randomPrice: {
    fn: () => (Math.random() * 1000).toFixed(2),
    comment: 'A random price between 0.00 and 1000.00',
  },
  $randomProduct: {
    fn: () => pick(products),
    comment: 'A random product',
  },
  $randomProductAdjective: {
    fn: () => pick(productAdjectives),
    comment: 'A random product adjective',
  },
  $randomProductMaterial: {
    fn: () => pick(productMaterials),
    comment: 'A random product material',
  },
  $randomProductName: {
    fn: () => pick(productNames),
    comment: 'A random product name',
  },
  $randomDepartment: {
    fn: () => pick(departments),
    comment: 'A random commerce department',
  },

  // ---------------------------------- Grammar ----------------------------------
  $randomNoun: {
    fn: () => pick(nouns),
    comment: 'A random noun',
  },
  $randomVerb: {
    fn: () => pick(verbs),
    comment: 'A random verb',
  },
  $randomIngverb: {
    fn: () => pick(ingVerbs),
    comment: 'A random verb ending in `-ing`',
  },
  $randomAdjective: {
    fn: () => pick(adjectives),
    comment: 'A random adjective',
  },
  $randomWord: {
    fn: () => pick(words),
    comment: 'A random word',
  },
  $randomWords: {
    fn: () => pickWords(words, 2, 5),
    comment: 'Some random words',
  },
  $randomPhrase: {
    fn: () => pick(buzzPhrases),
    comment: 'A random phrase',
  },

  // ---------------------------------- Lorem ipsum ----------------------------------
  $randomLoremWord: {
    fn: () => pick(loremWords),
    comment: 'A random word of lorem ipsum text',
  },
  $randomLoremWords: {
    fn: () => pickWords(loremWords, 3, 3),
    comment: 'Some random words of lorem ipsum text',
  },
  $randomLoremSentence: {
    fn: () => pick(loremSentences),
    comment: 'A random sentence of lorem ipsum text',
  },
  $randomLoremSentences: {
    fn: () => pickSentences(loremSentences, 2, 6),
    comment: 'A random 2 to 6 sentences of lorem ipsum text',
  },
  $randomLoremParagraph: {
    fn: () => pick(loremParagraphs),
    comment: 'A random paragraph of lorem ipsum text',
  },
  $randomLoremParagraphs: {
    fn: () => pickSentences(loremParagraphs, 3, 3),
    comment: '3 random paragraphs of lorem ipsum text',
  },
  $randomLoremText: {
    fn: () => pickSentences(loremParagraphs, 1, 3),
    comment: 'A random amount of lorem ipsum text',
  },
  $randomLoremSlug: {
    fn: () => pick(loremSlugs),
    comment: 'A random lorem ipsum URL slug',
  },
  $randomLoremLines: {
    fn: () => pickLines(loremSentences, 1, 5),
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
