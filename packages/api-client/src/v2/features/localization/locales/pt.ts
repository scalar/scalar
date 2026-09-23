import type { ApiClientTranslations } from '@scalar/types/api-reference'

/** Built-in API Client translations for pt. */
export const pt = {
  'serverVariablesSelect': {
    'selected': 'Selecionado:',
  },
  'serverVariablesTextbox': {
    'value': 'valor',
  },
  'sidebarListElementForm': {
    'cancel': 'Cancelar',
  },
  'requestBlock': {
    'authentication': 'Autenticação',
    'variables': 'Variáveis',
    'cookies': 'Cookies',
    'headers': 'Cabeçalhos',
    'queryParameters': 'Parâmetros de consulta',
    'queryString': 'String de consulta',
    'queryStringDescription':
      'Este parâmetro fornece toda a string de consulta, por isso não é possível adicionar outros parâmetros nomeados. Os parâmetros nomeados existentes são enviados depois; as chaves duplicadas são preservadas.',
    'requestBody': 'Corpo da requisição',
    'requestName': 'Nome da requisição',
    'label': 'Requisição: {name}',
  },
  'responseBlock': {
    'response': 'Resposta',
    'requestHeaders': 'Cabeçalhos da requisição',
    'responseHeaders': 'Cabeçalhos da resposta',
    'body': 'Corpo',
  },
  'codeInput': {
    'required': 'Obrigatório',
    'exitHint': 'Pressione {escape} e depois {tab} para sair',
  },
  'codeInputLite': {
    'required': 'Obrigatório',
  },
  'dataTableInput': {
    'clearValue': 'Limpar valor',
    'showPassword': 'Mostrar senha',
    'hidePassword': 'Ocultar senha',
  },
  'dataTableInputSelect': {
    'value': 'Valor',
    'addValue': 'Adicionar valor',
  },
  'confirmationForm': {
    'cancel': 'Cancelar',
    'save': 'Salvar',
  },
  'collapsibleSection': {
    'collapsed': '(Recolhido)',
    'item': 'Item',
    'items': 'Itens',
  },
  'modalClientContainer': {
    'label': 'Cliente de API',
  },
  'serverDropdown': {
    'server': 'Servidor:',
    'addServer': 'Adicionar servidor',
    'updateServers': 'Atualizar servidores',
    'unknownServer': 'Servidor desconhecido',
  },
  'sidebar': {
    'search': 'Buscar',
  },
  'sidebarMenu': {
    'settings': 'Configurações',
  },
  'sidebarToggle': {
    'hide': 'Ocultar barra lateral',
    'show': 'Mostrar barra lateral',
  },
  'environmentsList': {
    'addEnvironment': 'Adicionar ambiente',
  },
  'modal': {
    'noDocumentSelected': 'Nenhum documento selecionado',
  },
  'operation': {
    'selectAnOperationToViewDetails': 'Selecione uma operação para ver os detalhes',
  },
  'header': {
    'operationSettings': 'Configurações da operação',
    'closeClient': 'Fechar cliente',
  },
  'openApiClientButton': {
    'openAPIClient': 'Abrir cliente de API',
  },
  'requestBody': {
    'noBody': 'Sem corpo',
    'delete': 'Excluir',
    'selectFile': 'Selecionar arquivo',
    'multipartForm': 'Formulário multiparte',
    'formUrlEncoded': 'Formulário codificado em URL',
    'binaryFile': 'Arquivo binário',
    'other': 'Outro',
    'none': 'Nenhum',
  },
  'requestBodyStructured': {
    'body': 'Corpo',
  },
  'requestBodyViewToggle': {
    'form': 'Formulário',
    'raw': 'Bruto',
    'fixBody': 'Corrija o corpo para mudar para a visualização de formulário',
  },
  'requestCodeSnippet': {
    unavailable: 'Nenhuma amostra de código disponível para este exemplo.',
    'codeSnippet': 'Trecho de código',
  },
  'requestTable': {
    'enabled': 'Habilitado',
    'key': 'Chave',
    'value': 'Valor',
  },
  'requestTableRow': {
    'key': 'Chave',
    'value': 'Valor',
    'delete': 'Excluir',
    'selectFile': 'Selecionar arquivo',
    'globalCookieHint': 'Os cookies globais são compartilhados em todo o espaço de trabalho. Clique para acessá-los.',
    'readOnlyHint':
      'Esta propriedade é somente leitura. Para alterá-la, você precisa sobrescrevê-la ou desativá-la usando a caixa de seleção.',
    'include': 'Incluir {name} na requisição',
    'keyLabel': 'Chave de {name}',
    'valueLabel': 'Valor de {name}',
    'deleteRow': 'Excluir {name}',
    'row': 'linha',
  },
  'requestTableTooltip': {
    'min': 'mín.:',
    'max': 'máx.:',
    'default': 'padrão:',
    'invalid': 'A entrada é inválida',
    'moreInformation': 'Mais informações',
  },
  'headers': {
    'headerKey': 'Chave do cabeçalho',
    'headerValue': 'Valor do cabeçalho',
    'noHeaders': 'Sem cabeçalhos',
  },
  'responseBody': {
    'binaryFile': 'Arquivo binário',
  },
  'responseBodyPreview': {
    'previewUnavailable': 'Prévia indisponível',
  },
  'responseBodyStreaming': {
    'body': 'Corpo',
    'listening': 'Aguardando dados…',
    'cancel': 'Cancelar',
  },
  'responseBodyToggle': {
    'preview': 'Prévia',
    'raw': 'Bruto',
  },
  'responseBodyVirtual': {
    'body': 'Corpo',
    'largeBodyHint': 'O corpo desta resposta é grande demais para o realce de sintaxe.',
  },
  'responseCookies': {
    'cookies': 'Cookies',
    'cookieName': 'Nome do cookie',
    'cookieValue': 'Valor do cookie',
    'noCookies': 'Sem cookies',
  },
  'responseEmpty': {
    'roadmap': 'Roteiro de desenvolvimento',
    'poweredByScalarcom': 'Desenvolvido com Scalar.com',
    'getStarted': 'Começar',
    'newRequest': 'Nova requisição',
    'sendRequest': 'Enviar requisição',
    'version': 'Scalar App V{version} Beta',
  },
  'responseLoadingOverlay': {
    'cancel': 'Cancelar',
  },
  'addressBar': {
    'path': 'Caminho',
    'copyUrl': 'Copiar URL',
    'send': 'Enviar',
    'sendRequest': 'Enviar requisição {method} para {url}',
    'duplicateRequest': 'Uma requisição {method} para {path} já existe neste documento',
    'urlPlaceholder': 'Digite uma URL',
    'webhookUrlPlaceholder': 'Digite a URL completa do webhook, por exemplo https://example.com/hook',
  },
  'addressBarHistory': {
    'requestHistory': 'Histórico de requisições',
  },
  'environmentSelector': {
    'noEnvironment': 'Sem ambiente',
    'notAvailableInThisContext': 'Indisponível neste contexto',
    'environmentHint':
      'Os ambientes permitem gerenciar variáveis como chaves de API e URLs base em diferentes contextos.',
    'add': 'Adicionar ambiente',
    'select': 'Selecionar ambiente',
    'unavailable': '{name} (Indisponível)',
    'current': 'Ambiente atual: {name}',
  },
  'deleteRequestAuthModal': {
    'deleteSecurityScheme': 'Excluir esquema de segurança',
    'cancel': 'Cancelar',
    'delete': 'Excluir',
    'confirmation':
      'Esta ação não pode ser desfeita. Você está prestes a excluir o esquema de segurança {name} da coleção.',
  },
  'oauth2': {
    deviceAuthorizationUrl: 'URL de autorização do dispositivo',
    deviceVerificationPrompt: 'Abra a página de verificação e insira este código:',
    waitingForAuthorization: 'Aguardando autorização…',
    cancelDeviceAuthorization: 'Cancelar',

    'accessToken': 'Token de acesso',
    'refreshUrl': 'URL de renovação',
    'refresh': 'Atualizar',
    'authUrl': 'URL de autenticação',
    'tokenUrl': 'URL do token',
    'redirectUrl': 'URL de redirecionamento',
    'username': 'Nome de usuário',
    'password': 'Senha',
    'clientID': 'ID do cliente',
    'clientSecret': 'Segredo do cliente',
    'usePKCE': 'Usar PKCE',
    'credentialsLocation': 'Localização das credenciais',
    'authorize': 'Autorizar',
    'clear': 'Limpar',
    'failedToauthorize': 'Falha na autorização',
    'failedToRefreshToken': 'Falha ao renovar o token',
    'optionalRedirectUrl': 'URL de redirecionamento opcional',
  },
  'oauthScopesAddModal': {
    'name': 'Nome:',
    'description': 'Descrição:',
    'readUserData': 'Ler dados do usuário',
    'edit': 'Editar escopo',
    'add': 'Adicionar escopo',
    'save': 'Salvar',
    'required': 'O nome do escopo é obrigatório.',
    'duplicate': 'Já existe um escopo chamado "{name}".',
  },
  'oauthScopesInput': {
    'noScopesDefined': 'Nenhum escopo definido',
    'addScope': 'Adicionar escopo',
    'deselectAll': 'Desmarcar tudo',
    'selectAll': 'Selecionar tudo',
    'selectedScopes': 'Escopos selecionados: {count} / {total}',
    'editScope': 'Editar {name}',
    'deleteScope': 'Excluir {name}',
    'selectScope': 'Selecionar o escopo {name}',
  },
  'openIdConnect': {
    'discoveryUrl': 'URL de descoberta',
    'fetchConfiguration': 'Obter configuração',
    'failedToFetchConfiguration': 'Falha ao obter a configuração do OpenID Connect',
  },
  'requestAuthDataTable': {
    'noauthenticationSelected': 'Nenhuma autenticação selecionada',
  },
  'requestAuthTab': {
    'token': 'Token',
    'bearerToken': 'Token Bearer',
    'getAToken': 'Obter um token',
    'refresh': 'Atualizar',
    'username': 'Nome de usuário',
    'password': 'Senha',
    'name': 'Nome',
    'value': 'Valor',
    'cancel': 'Cancelar',
    'authorize': 'Autorizar',
    'unsupportedCredentials': 'O cliente do navegador não envia as credenciais deste esquema de segurança AsyncAPI.',
    'authorizeVia': 'Autorizar via {name}',
    'unsupportedType': 'O tipo de esquema de segurança {type} ainda não é compatível.',
    'missingType':
      'O esquema de segurança não tem um tipo. Verifique seu documento {type} ou a configuração de autenticação.',
    'failedToauthorize': 'Falha na autorização',
    'failedToRefresh': 'Falha ao atualizar',
    'configure': 'Configurar {name}',
    'mutualTlsHint':
      'O TLS mútuo autentica com um certificado de cliente apresentado durante a negociação TLS, portanto não há nada para inserir aqui.',
  },
  'commandActionForm': {
    'continue': 'Continuar',
  },
  'environment': {
    'thisIsTheActiveEnvironment': 'Este é o ambiente ativo',
    'active': 'Ativo',
    'editEnvironment': 'Editar ambiente',
    'deleteEnvironment': 'Excluir ambiente',
  },
  'environmentCreateModal': {
    'environmentName': 'Nome do ambiente',
    'thisEnvironmentNameIsAlreadyInUse': 'Este nome de ambiente já está em uso.',
    'update': 'Atualizar ambiente',
    'add': 'Adicionar ambiente',
  },
  'environmentDeleteModal': {
    'cancel': 'Cancelar',
    'deleteEnvironment': 'Excluir ambiente',
    'deleteConfirmation': 'Tem certeza de que deseja excluir este ambiente? Esta ação não pode ser desfeita.',
    'title': 'Excluir {name}',
  },
  'environmentVariablesDropdown': {
    'variableSuggestions': 'Sugestões de variáveis',
    'addVariable': 'Adicionar variável',
  },
  'environmentVariablesTable': {
    'name': 'Nome',
    'value': 'Valor',
    'actions': 'Ações',
    'environmentVariableName': 'Nome da variável de ambiente',
    'environmentVariableValue': 'Valor da variável de ambiente',
  },
  'documentSearchModal': {
    'documentSearch': 'Busca de documentos',
    'documentSearchResults': 'Resultados da busca de documentos',
    'navigate': '↑↓ Navegar',
    'select': '⏎ Selecionar',
    'keyboardInstructions':
      'Pressione seta para cima ou para baixo para navegar, Enter para selecionar e digite para filtrar os resultados',
  },
  'searchResult': {
    'httpMethod': 'Método HTTP:',
    'path': 'Caminho:',
    'description': 'Descrição:',
    'heading': 'Título',
    'operation': 'Operação',
    'tag': 'Tag',
  },
  'sectionFilter': {
    'all': 'Todos',
    'auth': 'Autenticação',
    'variables': 'Variáveis',
    'cookies': 'Cookies',
    'headers': 'Cabeçalhos',
    'query': 'Consulta',
    'body': 'Corpo',
  },
  'requestParams': {
    'clearAll': 'Limpar tudo: {title}',
    'clear': 'Limpar',
    'clearOptionalParameters': 'Limpar parâmetros opcionais',
  },
  'responseBodyDownload': {
    'download': 'Baixar corpo da resposta',
    'label': 'Baixar',
    'body': 'Corpo da resposta',
  },
  'responseMetaInformation': {
    'duration': 'Informações da resposta, duração:',
    'size': ', tamanho:',
    'status': ', status:',
  },
  'authSelector': {
    'selectedType': 'Tipo de autenticação selecionado: {type}',
    'multipleTypes': 'Vários tipos de autenticação selecionados',
    'selectType': 'Selecionar tipo de autenticação',
    'optional': 'Opcional',
    'required': 'Obrigatório',
    'deleteScheme': 'Excluir {name}',
    'requiredGroup': 'Autenticação obrigatória',
    'availableGroup': 'Autenticação disponível',
    'addGroup': 'Adicionar nova autenticação',
  },
  'operationBlock': {
    'webhookUrlRequired': 'A URL do webhook é obrigatória. Digite um destino primeiro.',
    'pathParametersRequired': 'Os parâmetros de caminho devem ter valores.',
    'forbiddenMethod': 'A API Fetch não pode enviar requisições {method}.',
  },
  'dataTableCheckbox': {
    'toggle': 'Alternar',
  },
  'pillTooltipHost': {
    'computedAtExecution': 'Calculado ao executar a requisição',
    'noValue': 'Sem valor',
  },
  'authOptions': {
    oauth2DeviceAuthorization: 'Autorização de dispositivo OAuth2',
    'apiKeyCookie': 'Chave de API em cookies',
    'apiKeyHeader': 'Chave de API em cabeçalhos',
    'apiKeyQuery': 'Chave de API em parâmetros de consulta',
    'httpBasic': 'HTTP Basic',
    'httpBearer': 'HTTP Bearer',
    'oauth2Implicit': 'Fluxo implícito do OAuth2',
    'oauth2Password': 'Fluxo de senha do OAuth2',
    'oauth2ClientCredentials': 'Credenciais de cliente do OAuth2',
    'oauth2AuthorizationFlow': 'Código de autorização do OAuth2',
  },
  'deleteSidebarListElement': {
    'delete': 'Excluir {name}',
  },
  'deleteModal': {
    'delete': 'Excluir {name}',
  },
} satisfies ApiClientTranslations
