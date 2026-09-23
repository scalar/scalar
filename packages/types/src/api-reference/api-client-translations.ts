/** User-facing API Client strings, grouped by component. Protocol values and user content are not translated. */
export type ApiClientTranslations = {
  serverVariablesSelect: {
    selected: string
  }
  serverVariablesTextbox: {
    value: string
  }
  sidebarListElementForm: {
    cancel: string
  }
  requestBlock: {
    authentication: string
    variables: string
    cookies: string
    headers: string
    queryParameters: string
    queryString: string
    queryStringDescription: string
    requestBody: string
    requestName: string
    label: string
  }
  responseBlock: {
    response: string
    requestHeaders: string
    responseHeaders: string
    body: string
  }
  codeInput: {
    required: string
    exitHint: string
  }
  codeInputLite: {
    required: string
  }
  dataTableInput: {
    clearValue: string
    showPassword: string
    hidePassword: string
  }
  dataTableInputSelect: {
    value: string
    addValue: string
  }
  confirmationForm: {
    cancel: string
    save: string
  }
  collapsibleSection: {
    collapsed: string
    item: string
    items: string
  }
  modalClientContainer: {
    label: string
  }
  serverDropdown: {
    server: string
    addServer: string
    updateServers: string
    unknownServer: string
  }
  sidebar: {
    search: string
  }
  sidebarMenu: {
    settings: string
  }
  sidebarToggle: {
    hide: string
    show: string
  }
  environmentsList: {
    addEnvironment: string
  }
  modal: {
    noDocumentSelected: string
  }
  operation: {
    selectAnOperationToViewDetails: string
  }
  header: {
    operationSettings: string
    closeClient: string
  }
  openApiClientButton: {
    openAPIClient: string
  }
  requestBody: {
    noBody: string
    delete: string
    selectFile: string
    multipartForm: string
    formUrlEncoded: string
    binaryFile: string
    other: string
    none: string
  }
  requestBodyStructured: {
    body: string
  }
  requestBodyViewToggle: {
    form: string
    raw: string
    fixBody: string
  }
  requestCodeSnippet: {
    codeSnippet: string
  }
  requestTable: {
    enabled: string
    key: string
    value: string
  }
  requestTableRow: {
    key: string
    value: string
    delete: string
    selectFile: string
    globalCookieHint: string
    readOnlyHint: string
    include: string
    keyLabel: string
    valueLabel: string
    deleteRow: string
    row: string
  }
  requestTableTooltip: {
    min: string
    max: string
    default: string
    invalid: string
    moreInformation: string
  }
  headers: {
    headerKey: string
    headerValue: string
    noHeaders: string
  }
  responseBody: {
    binaryFile: string
  }
  responseBodyPreview: {
    previewUnavailable: string
  }
  responseBodyStreaming: {
    body: string
    listening: string
    cancel: string
  }
  responseBodyToggle: {
    preview: string
    raw: string
  }
  responseBodyVirtual: {
    body: string
    largeBodyHint: string
  }
  responseCookies: {
    cookies: string
    cookieName: string
    cookieValue: string
    noCookies: string
  }
  responseEmpty: {
    roadmap: string
    poweredByScalarcom: string
    getStarted: string
    newRequest: string
    sendRequest: string
    version: string
  }
  responseLoadingOverlay: {
    cancel: string
  }
  addressBar: {
    path: string
    copyUrl: string
    send: string
    sendRequest: string
    duplicateRequest: string
    urlPlaceholder: string
    webhookUrlPlaceholder: string
  }
  addressBarHistory: {
    requestHistory: string
  }
  environmentSelector: {
    noEnvironment: string
    notAvailableInThisContext: string
    environmentHint: string
    add: string
    select: string
    unavailable: string
    current: string
  }
  deleteRequestAuthModal: {
    deleteSecurityScheme: string
    cancel: string
    delete: string
    confirmation: string
  }
  oauth2: {
    deviceAuthorizationUrl: string
    deviceVerificationPrompt: string
    waitingForAuthorization: string
    cancelDeviceAuthorization: string
    accessToken: string
    refreshUrl: string
    refresh: string
    authUrl: string
    tokenUrl: string
    redirectUrl: string
    username: string
    password: string
    clientID: string
    clientSecret: string
    usePKCE: string
    credentialsLocation: string
    authorize: string
    clear: string
    failedToauthorize: string
    failedToRefreshToken: string
    optionalRedirectUrl: string
  }
  oauthScopesAddModal: {
    name: string
    description: string
    readUserData: string
    edit: string
    add: string
    save: string
    required: string
    duplicate: string
  }
  oauthScopesInput: {
    noScopesDefined: string
    addScope: string
    deselectAll: string
    selectAll: string
    selectedScopes: string
    editScope: string
    deleteScope: string
    selectScope: string
  }
  openIdConnect: {
    discoveryUrl: string
    fetchConfiguration: string
    failedToFetchConfiguration: string
  }
  requestAuthDataTable: {
    noauthenticationSelected: string
  }
  requestAuthTab: {
    token: string
    bearerToken: string
    getAToken: string
    refresh: string
    username: string
    password: string
    name: string
    value: string
    cancel: string
    authorize: string
    unsupportedCredentials: string
    authorizeVia: string
    unsupportedType: string
    missingType: string
    failedToauthorize: string
    failedToRefresh: string
    configure: string
    mutualTlsHint: string
  }
  commandActionForm: {
    continue: string
  }
  environment: {
    thisIsTheActiveEnvironment: string
    active: string
    editEnvironment: string
    deleteEnvironment: string
  }
  environmentCreateModal: {
    environmentName: string
    thisEnvironmentNameIsAlreadyInUse: string
    update: string
    add: string
  }
  environmentDeleteModal: {
    cancel: string
    deleteEnvironment: string
    deleteConfirmation: string
    title: string
  }
  environmentVariablesDropdown: {
    variableSuggestions: string
    addVariable: string
  }
  environmentVariablesTable: {
    name: string
    value: string
    actions: string
    environmentVariableName: string
    environmentVariableValue: string
  }
  documentSearchModal: {
    documentSearch: string
    documentSearchResults: string
    navigate: string
    select: string
    keyboardInstructions: string
  }
  searchResult: {
    httpMethod: string
    path: string
    description: string
    heading: string
    operation: string
    tag: string
  }
  sectionFilter: {
    all: string
    auth: string
    variables: string
    cookies: string
    headers: string
    query: string
    body: string
  }
  requestParams: {
    clearAll: string
    clear: string
    clearOptionalParameters: string
  }
  responseBodyDownload: {
    download: string
    label: string
    body: string
  }
  responseMetaInformation: {
    duration: string
    size: string
    status: string
  }
  authSelector: {
    selectedType: string
    multipleTypes: string
    selectType: string
    optional: string
    required: string
    deleteScheme: string
    requiredGroup: string
    availableGroup: string
    addGroup: string
  }
  operationBlock: {
    webhookUrlRequired: string
    pathParametersRequired: string
    forbiddenMethod: string
  }
  dataTableCheckbox: {
    toggle: string
  }
  pillTooltipHost: {
    computedAtExecution: string
    noValue: string
  }
  authOptions: {
    oauth2DeviceAuthorization: string
    apiKeyCookie: string
    apiKeyHeader: string
    apiKeyQuery: string
    httpBasic: string
    httpBearer: string
    oauth2Implicit: string
    oauth2Password: string
    oauth2ClientCredentials: string
    oauth2AuthorizationFlow: string
  }
  deleteSidebarListElement: {
    delete: string
  }
  deleteModal: {
    delete: string
  }
}
