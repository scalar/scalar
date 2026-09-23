import type { ApiClientTranslations } from '@scalar/types/api-reference'

/** Built-in API Client translations for es. */
export const es = {
  'serverVariablesSelect': {
    'selected': 'Seleccionado:',
  },
  'serverVariablesTextbox': {
    'value': 'valor',
  },
  'sidebarListElementForm': {
    'cancel': 'Cancelar',
  },
  'requestBlock': {
    'authentication': 'Autenticación',
    'variables': 'Variables',
    'cookies': 'Cookies',
    'headers': 'Encabezados',
    'queryParameters': 'Parámetros de consulta',
    'requestBody': 'Cuerpo de la solicitud',
    'requestName': 'Nombre de la solicitud',
    'label': 'Solicitud: {name}',
  },
  'responseBlock': {
    'response': 'Respuesta',
    'requestHeaders': 'Encabezados de la solicitud',
    'responseHeaders': 'Encabezados de la respuesta',
    'body': 'Cuerpo',
  },
  'codeInput': {
    'required': 'Obligatorio',
    'exitHint': 'Pulse {escape} y luego {tab} para salir',
  },
  'codeInputLite': {
    'required': 'Obligatorio',
  },
  'dataTableInput': {
    'clearValue': 'Borrar valor',
    'showPassword': 'Mostrar contraseña',
    'hidePassword': 'Ocultar contraseña',
  },
  'dataTableInputSelect': {
    'value': 'Valor',
    'addValue': 'Añadir valor',
  },
  'confirmationForm': {
    'cancel': 'Cancelar',
    'save': 'Guardar',
  },
  'collapsibleSection': {
    'collapsed': '(Contraído)',
    'item': 'Elemento',
    'items': 'Elementos',
  },
  'modalClientContainer': {
    'label': 'Cliente API',
  },
  'serverDropdown': {
    'server': 'Servidor:',
    'addServer': 'Añadir servidor',
    'updateServers': 'Actualizar servidores',
    'unknownServer': 'Servidor desconocido',
  },
  'sidebar': {
    'search': 'Buscar',
  },
  'sidebarMenu': {
    'settings': 'Configuración',
  },
  'sidebarToggle': {
    'hide': 'Ocultar barra lateral',
    'show': 'Mostrar barra lateral',
  },
  'environmentsList': {
    'addEnvironment': 'Añadir entorno',
  },
  'modal': {
    'noDocumentSelected': 'Ningún documento seleccionado',
  },
  'operation': {
    'selectAnOperationToViewDetails': 'Seleccione una operación para ver los detalles',
  },
  'header': {
    'operationSettings': 'Configuración de la operación',
    'closeClient': 'Cerrar cliente',
  },
  'openApiClientButton': {
    'openAPIClient': 'Abrir cliente API',
  },
  'requestBody': {
    'noBody': 'Sin cuerpo',
    'delete': 'Eliminar',
    'selectFile': 'Seleccionar archivo',
    'multipartForm': 'Formulario multiparte',
    'formUrlEncoded': 'Formulario codificado en URL',
    'binaryFile': 'Archivo binario',
    'other': 'Otro',
    'none': 'Ninguno',
  },
  'requestBodyStructured': {
    'body': 'Cuerpo',
  },
  'requestBodyViewToggle': {
    'form': 'Formulario',
    'raw': 'Sin procesar',
    'fixBody': 'Corrija el cuerpo para cambiar a la vista de formulario',
  },
  'requestCodeSnippet': {
    unavailable: 'No hay ninguna muestra de código disponible para este ejemplo.',
    'codeSnippet': 'Fragmento de código',
  },
  'requestTable': {
    'enabled': 'Habilitado',
    'key': 'Clave',
    'value': 'Valor',
  },
  'requestTableRow': {
    'key': 'Clave',
    'value': 'Valor',
    'delete': 'Eliminar',
    'selectFile': 'Seleccionar archivo',
    'globalCookieHint':
      'Las cookies globales se comparten en todo el espacio de trabajo. Haga clic para acceder a ellas.',
    'readOnlyHint':
      'Esta propiedad es de solo lectura. Para cambiarla, debe sobrescribirla o desactivarla mediante la casilla de verificación.',
    'include': 'Incluir {name} en la solicitud',
    'keyLabel': 'Clave de {name}',
    'valueLabel': 'Valor de {name}',
    'deleteRow': 'Eliminar {name}',
    'row': 'fila',
  },
  'requestTableTooltip': {
    'min': 'mín.:',
    'max': 'máx.:',
    'default': 'predeterminado:',
    'invalid': 'La entrada no es válida',
    'moreInformation': 'Más información',
  },
  'headers': {
    'headerKey': 'Clave del encabezado',
    'headerValue': 'Valor del encabezado',
    'noHeaders': 'Sin encabezados',
  },
  'responseBody': {
    'binaryFile': 'Archivo binario',
  },
  'responseBodyPreview': {
    'previewUnavailable': 'Vista previa no disponible',
  },
  'responseBodyStreaming': {
    'body': 'Cuerpo',
    'listening': 'Escuchando…',
    'cancel': 'Cancelar',
  },
  'responseBodyToggle': {
    'preview': 'Vista previa',
    'raw': 'Sin procesar',
  },
  'responseBodyVirtual': {
    'body': 'Cuerpo',
    'largeBodyHint': 'El cuerpo de esta respuesta es demasiado grande para el resaltado de sintaxis.',
  },
  'responseCookies': {
    'cookies': 'Cookies',
    'cookieName': 'Nombre de la cookie',
    'cookieValue': 'Valor de la cookie',
    'noCookies': 'Sin cookies',
  },
  'responseEmpty': {
    'roadmap': 'Hoja de ruta',
    'poweredByScalarcom': 'Desarrollado con Scalar.com',
    'getStarted': 'Comenzar',
    'newRequest': 'Nueva solicitud',
    'sendRequest': 'Enviar solicitud',
    'version': 'Scalar App V{version} Beta',
  },
  'responseLoadingOverlay': {
    'cancel': 'Cancelar',
  },
  'addressBar': {
    'path': 'Ruta',
    'copyUrl': 'Copiar URL',
    'send': 'Enviar',
    'sendRequest': 'Enviar solicitud {method} a {url}',
    'duplicateRequest': 'Ya existe una solicitud {method} a {path} en este documento',
    'urlPlaceholder': 'Introduzca una URL',
    'webhookUrlPlaceholder': 'Introduzca la URL completa del webhook, p. ej., https://example.com/hook',
  },
  'addressBarHistory': {
    'requestHistory': 'Historial de solicitudes',
  },
  'environmentSelector': {
    'noEnvironment': 'Sin entorno',
    'notAvailableInThisContext': 'No disponible en este contexto',
    'environmentHint': 'Los entornos permiten gestionar variables como claves API y URL base en diferentes contextos.',
    'add': 'Añadir entorno',
    'select': 'Seleccionar entorno',
    'unavailable': '{name} (No disponible)',
    'current': 'Entorno actual: {name}',
  },
  'deleteRequestAuthModal': {
    'deleteSecurityScheme': 'Eliminar esquema de seguridad',
    'cancel': 'Cancelar',
    'delete': 'Eliminar',
    'confirmation': 'Esta acción no se puede deshacer. Va a eliminar el esquema de seguridad {name} de la colección.',
  },
  'oauth2': {
    deviceAuthorizationUrl: 'URL de autorización del dispositivo',
    deviceVerificationPrompt: 'Abre la página de verificación e introduce este código:',
    waitingForAuthorization: 'Esperando autorización…',
    cancelDeviceAuthorization: 'Cancelar',

    'accessToken': 'Token de acceso',
    'refreshUrl': 'URL de actualización',
    'refresh': 'Actualizar',
    'authUrl': 'URL de autenticación',
    'tokenUrl': 'URL del token',
    'redirectUrl': 'URL de redirección',
    'username': 'Nombre de usuario',
    'password': 'Contraseña',
    'clientID': 'ID de cliente',
    'clientSecret': 'Secreto de cliente',
    'usePKCE': 'Usar PKCE',
    'credentialsLocation': 'Ubicación de las credenciales',
    'authorize': 'Autorizar',
    'clear': 'Borrar',
    'failedToauthorize': 'Error de autorización',
    'failedToRefreshToken': 'No se pudo actualizar el token',
    'optionalRedirectUrl': 'URL de redirección opcional',
  },
  'oauthScopesAddModal': {
    'name': 'Nombre:',
    'description': 'Descripción:',
    'readUserData': 'Leer datos del usuario',
    'edit': 'Editar ámbito',
    'add': 'Añadir ámbito',
    'save': 'Guardar',
    'required': 'El nombre del ámbito es obligatorio.',
    'duplicate': 'Ya existe un ámbito llamado «{name}».',
  },
  'oauthScopesInput': {
    'noScopesDefined': 'No hay ámbitos definidos',
    'addScope': 'Añadir ámbito',
    'deselectAll': 'Deseleccionar todo',
    'selectAll': 'Seleccionar todo',
    'selectedScopes': 'Ámbitos seleccionados: {count} / {total}',
    'editScope': 'Editar {name}',
    'deleteScope': 'Eliminar {name}',
    'selectScope': 'Seleccionar el ámbito {name}',
  },
  'openIdConnect': {
    'discoveryUrl': 'URL de descubrimiento',
    'fetchConfiguration': 'Obtener configuración',
    'failedToFetchConfiguration': 'No se pudo obtener la configuración de OpenID Connect',
  },
  'requestAuthDataTable': {
    'noauthenticationSelected': 'No se ha seleccionado ninguna autenticación',
  },
  'requestAuthTab': {
    'token': 'Token',
    'bearerToken': 'Token Bearer',
    'getAToken': 'Obtener un token',
    'refresh': 'Actualizar',
    'username': 'Nombre de usuario',
    'password': 'Contraseña',
    'name': 'Nombre',
    'value': 'Valor',
    'cancel': 'Cancelar',
    'authorize': 'Autorizar',
    'unsupportedCredentials':
      'El cliente del navegador no envía las credenciales de este esquema de seguridad AsyncAPI.',
    'authorizeVia': 'Autorizar mediante {name}',
    'unsupportedType': 'El tipo de esquema de seguridad {type} aún no es compatible.',
    'missingType':
      'Falta el tipo del esquema de seguridad. Revise el documento {type} o la configuración de autenticación.',
    'failedToauthorize': 'Error de autorización',
    'failedToRefresh': 'No se pudo actualizar',
    'configure': 'Configurar {name}',
    'mutualTlsHint':
      'TLS mutuo autentica mediante un certificado de cliente presentado durante la negociación TLS, por lo que no es necesario introducir nada aquí.',
  },
  'commandActionForm': {
    'continue': 'Continuar',
  },
  'environment': {
    'thisIsTheActiveEnvironment': 'Este es el entorno activo',
    'active': 'Activo',
    'editEnvironment': 'Editar entorno',
    'deleteEnvironment': 'Eliminar entorno',
  },
  'environmentCreateModal': {
    'environmentName': 'Nombre del entorno',
    'thisEnvironmentNameIsAlreadyInUse': 'Este nombre de entorno ya está en uso.',
    'update': 'Actualizar entorno',
    'add': 'Añadir entorno',
  },
  'environmentDeleteModal': {
    'cancel': 'Cancelar',
    'deleteEnvironment': 'Eliminar entorno',
    'deleteConfirmation': '¿Seguro que desea eliminar este entorno? Esta acción no se puede deshacer.',
    'title': 'Eliminar {name}',
  },
  'environmentVariablesDropdown': {
    'variableSuggestions': 'Sugerencias de variables',
    'addVariable': 'Añadir variable',
  },
  'environmentVariablesTable': {
    'name': 'Nombre',
    'value': 'Valor',
    'actions': 'Acciones',
    'environmentVariableName': 'Nombre de la variable de entorno',
    'environmentVariableValue': 'Valor de la variable de entorno',
  },
  'documentSearchModal': {
    'documentSearch': 'Búsqueda de documentos',
    'documentSearchResults': 'Resultados de la búsqueda de documentos',
    'navigate': '↑↓ Navegar',
    'select': '⏎ Seleccionar',
    'keyboardInstructions':
      'Pulse las flechas arriba o abajo para navegar, Intro para seleccionar y escriba para filtrar los resultados',
  },
  'searchResult': {
    'httpMethod': 'Método HTTP:',
    'path': 'Ruta:',
    'description': 'Descripción:',
    'heading': 'Encabezado',
    'operation': 'Operación',
    'tag': 'Etiqueta',
  },
  'sectionFilter': {
    'all': 'Todo',
    'auth': 'Autenticación',
    'variables': 'Variables',
    'cookies': 'Cookies',
    'headers': 'Encabezados',
    'query': 'Consulta',
    'body': 'Cuerpo',
  },
  'requestParams': {
    'clearAll': 'Borrar todo: {title}',
    'clear': 'Borrar',
    'clearOptionalParameters': 'Borrar parámetros opcionales',
  },
  'responseBodyDownload': {
    'download': 'Descargar cuerpo de la respuesta',
    'label': 'Descargar',
    'body': 'Cuerpo de la respuesta',
  },
  'responseMetaInformation': {
    'duration': 'Información de la respuesta, duración:',
    'size': ', tamaño:',
    'status': ', estado:',
  },
  'authSelector': {
    'selectedType': 'Tipo de autenticación seleccionado: {type}',
    'multipleTypes': 'Varios tipos de autenticación seleccionados',
    'selectType': 'Seleccionar tipo de autenticación',
    'optional': 'Opcional',
    'required': 'Obligatorio',
    'deleteScheme': 'Eliminar {name}',
    'requiredGroup': 'Autenticación obligatoria',
    'availableGroup': 'Autenticación disponible',
    'addGroup': 'Añadir nueva autenticación',
  },
  'operationBlock': {
    'webhookUrlRequired': 'Se requiere la URL del webhook. Introduzca primero un destino.',
    'pathParametersRequired': 'Los parámetros de ruta deben tener valores.',
  },
  'dataTableCheckbox': {
    'toggle': 'Alternar',
  },
  'pillTooltipHost': {
    'computedAtExecution': 'Se calcula al ejecutar la solicitud',
    'noValue': 'Sin valor',
  },
  'authOptions': {
    oauth2DeviceAuthorization: 'Autorización de dispositivo OAuth2',
    'apiKeyCookie': 'Clave API en cookies',
    'apiKeyHeader': 'Clave API en encabezados',
    'apiKeyQuery': 'Clave API en parámetros de consulta',
    'httpBasic': 'HTTP Basic',
    'httpBearer': 'HTTP Bearer',
    'oauth2Implicit': 'Flujo implícito de OAuth2',
    'oauth2Password': 'Flujo de contraseña de OAuth2',
    'oauth2ClientCredentials': 'Credenciales de cliente de OAuth2',
    'oauth2AuthorizationFlow': 'Código de autorización de OAuth2',
  },
  'deleteSidebarListElement': {
    'delete': 'Eliminar {name}',
  },
  'deleteModal': {
    'delete': 'Eliminar {name}',
  },
} satisfies ApiClientTranslations
