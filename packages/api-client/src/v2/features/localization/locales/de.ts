import type { ApiClientTranslations } from '@scalar/types/api-reference'

/** Built-in API Client translations for de. */
export const de = {
  'serverVariablesSelect': {
    'selected': 'Ausgewählt:',
  },
  'serverVariablesTextbox': {
    'value': 'Wert',
  },
  'sidebarListElementForm': {
    'cancel': 'Abbrechen',
  },
  'requestBlock': {
    'authentication': 'Authentifizierung',
    'variables': 'Variablen',
    'cookies': 'Cookies',
    'headers': 'Header',
    'queryParameters': 'Abfrageparameter',
    'queryString': 'Abfragezeichenfolge',
    'queryStringDescription':
      'Dieser Parameter enthält die gesamte Abfragezeichenfolge. Daher können keine weiteren benannten Parameter hinzugefügt werden. Vorhandene benannte Parameter werden danach gesendet; doppelte Schlüssel bleiben erhalten.',
    'requestBody': 'Anfrageinhalt',
    'requestName': 'Anfragename',
    'label': 'Anfrage: {name}',
  },
  'responseBlock': {
    'response': 'Antwort',
    'requestHeaders': 'Anfrage-Header',
    'responseHeaders': 'Antwort-Header',
    'body': 'Inhalt',
  },
  'codeInput': {
    'required': 'Erforderlich',
    'exitHint': 'Drücken Sie {escape} und dann {tab}, um das Feld zu verlassen',
  },
  'codeInputLite': {
    'required': 'Erforderlich',
  },
  'dataTableInput': {
    'clearValue': 'Wert löschen',
    'showPassword': 'Passwort anzeigen',
    'hidePassword': 'Passwort ausblenden',
  },
  'dataTableInputSelect': {
    'value': 'Wert',
    'addValue': 'Wert hinzufügen',
  },
  'confirmationForm': {
    'cancel': 'Abbrechen',
    'save': 'Speichern',
  },
  'collapsibleSection': {
    'collapsed': '(Eingeklappt)',
    'item': 'Element',
    'items': 'Elemente',
  },
  'modalClientContainer': {
    'label': 'API-Client',
  },
  'serverDropdown': {
    'server': 'Server:',
    'addServer': 'Server hinzufügen',
    'updateServers': 'Server aktualisieren',
    'unknownServer': 'Unbekannter Server',
  },
  'sidebar': {
    'search': 'Suchen',
  },
  'sidebarMenu': {
    'settings': 'Einstellungen',
  },
  'sidebarToggle': {
    'hide': 'Seitenleiste ausblenden',
    'show': 'Seitenleiste anzeigen',
  },
  'environmentsList': {
    'addEnvironment': 'Umgebung hinzufügen',
  },
  'modal': {
    'noDocumentSelected': 'Kein Dokument ausgewählt',
  },
  'operation': {
    'selectAnOperationToViewDetails': 'Wählen Sie eine Operation aus, um Details anzuzeigen',
  },
  'header': {
    'operationSettings': 'Operationseinstellungen',
    'closeClient': 'Client schließen',
  },
  'openApiClientButton': {
    'openAPIClient': 'API-Client öffnen',
  },
  'requestBody': {
    'noBody': 'Kein Inhalt',
    'delete': 'Löschen',
    'selectFile': 'Datei auswählen',
    'multipartForm': 'Mehrteiliges Formular',
    'formUrlEncoded': 'URL-kodiertes Formular',
    'binaryFile': 'Binärdatei',
    'other': 'Andere',
    'none': 'Keine',
  },
  'requestBodyStructured': {
    'body': 'Inhalt',
  },
  'requestBodyViewToggle': {
    'form': 'Formular',
    'raw': 'Rohdaten',
    'fixBody': 'Korrigieren Sie den Inhalt, um zur Formularansicht zu wechseln',
  },
  'requestCodeSnippet': {
    'codeSnippet': 'Codebeispiel',
  },
  'requestTable': {
    'enabled': 'Aktiviert',
    'key': 'Schlüssel',
    'value': 'Wert',
  },
  'requestTableRow': {
    'key': 'Schlüssel',
    'value': 'Wert',
    'delete': 'Löschen',
    'selectFile': 'Datei auswählen',
    'globalCookieHint':
      'Globale Cookies werden im gesamten Arbeitsbereich gemeinsam genutzt. Klicken Sie, um dorthin zu navigieren.',
    'readOnlyHint':
      'Diese Eigenschaft ist schreibgeschützt. Um sie zu ändern, müssen Sie sie überschreiben oder über das Kontrollkästchen deaktivieren.',
    'include': '{name} in die Anfrage aufnehmen',
    'keyLabel': 'Schlüssel für {name}',
    'valueLabel': 'Wert für {name}',
    'deleteRow': '{name} löschen',
    'row': 'Zeile',
  },
  'requestTableTooltip': {
    'min': 'Min.:',
    'max': 'Max.:',
    'default': 'Standard:',
    'invalid': 'Ungültige Eingabe',
    'moreInformation': 'Weitere Informationen',
  },
  'headers': {
    'headerKey': 'Header-Schlüssel',
    'headerValue': 'Header-Wert',
    'noHeaders': 'Keine Header',
  },
  'responseBody': {
    'binaryFile': 'Binärdatei',
  },
  'responseBodyPreview': {
    'previewUnavailable': 'Vorschau nicht verfügbar',
  },
  'responseBodyStreaming': {
    'body': 'Inhalt',
    'listening': 'Warten auf Daten…',
    'cancel': 'Abbrechen',
  },
  'responseBodyToggle': {
    'preview': 'Vorschau',
    'raw': 'Rohdaten',
  },
  'responseBodyVirtual': {
    'body': 'Inhalt',
    'largeBodyHint': 'Dieser Antwortinhalt ist zu groß für die Syntaxhervorhebung.',
  },
  'responseCookies': {
    'cookies': 'Cookies',
    'cookieName': 'Cookie-Name',
    'cookieValue': 'Cookie-Wert',
    'noCookies': 'Keine Cookies',
  },
  'responseEmpty': {
    'roadmap': 'Roadmap',
    'poweredByScalarcom': 'Unterstützt von Scalar.com',
    'getStarted': 'Erste Schritte',
    'newRequest': 'Neue Anfrage',
    'sendRequest': 'Anfrage senden',
    'version': 'Scalar App V{version} Beta',
  },
  'responseLoadingOverlay': {
    'cancel': 'Abbrechen',
  },
  'addressBar': {
    'path': 'Pfad',
    'copyUrl': 'URL kopieren',
    'send': 'Senden',
    'sendRequest': '{method}-Anfrage an {url} senden',
    'duplicateRequest': 'Eine {method}-Anfrage an {path} existiert bereits in diesem Dokument',
    'urlPlaceholder': 'URL eingeben',
    'webhookUrlPlaceholder': 'Vollständige Webhook-URL eingeben, z. B. https://example.com/hook',
  },
  'addressBarHistory': {
    'requestHistory': 'Anfrageverlauf',
  },
  'environmentSelector': {
    'noEnvironment': 'Keine Umgebung',
    'notAvailableInThisContext': 'In diesem Kontext nicht verfügbar',
    'environmentHint':
      'Mit Umgebungen können Sie Variablen wie API-Schlüssel und Basis-URLs für verschiedene Kontexte verwalten.',
    'add': 'Umgebung hinzufügen',
    'select': 'Umgebung auswählen',
    'unavailable': '{name} (Nicht verfügbar)',
    'current': 'Aktuelle Umgebung: {name}',
  },
  'deleteRequestAuthModal': {
    'deleteSecurityScheme': 'Sicherheitsschema löschen',
    'cancel': 'Abbrechen',
    'delete': 'Löschen',
    'confirmation':
      'Dies kann nicht rückgängig gemacht werden. Sie löschen das Sicherheitsschema {name} aus der Sammlung.',
  },
  'oauth2': {
    deviceAuthorizationUrl: 'URL für die Geräteautorisierung',
    deviceVerificationPrompt: 'Öffnen Sie die Bestätigungsseite und geben Sie diesen Code ein:',
    waitingForAuthorization: 'Warten auf Autorisierung…',
    cancelDeviceAuthorization: 'Abbrechen',

    'accessToken': 'Zugriffstoken',
    'refreshUrl': 'Aktualisierungs-URL',
    'refresh': 'Aktualisieren',
    'authUrl': 'Authentifizierungs-URL',
    'tokenUrl': 'Token-URL',
    'redirectUrl': 'Weiterleitungs-URL',
    'username': 'Benutzername',
    'password': 'Passwort',
    'clientID': 'Client-ID',
    'clientSecret': 'Client-Geheimnis',
    'usePKCE': 'PKCE verwenden',
    'credentialsLocation': 'Position der Zugangsdaten',
    'authorize': 'Autorisieren',
    'clear': 'Leeren',
    'failedToauthorize': 'Autorisierung fehlgeschlagen',
    'failedToRefreshToken': 'Token-Aktualisierung fehlgeschlagen',
    'optionalRedirectUrl': 'Optionale Weiterleitungs-URL',
  },
  'oauthScopesAddModal': {
    'name': 'Name:',
    'description': 'Beschreibung:',
    'readUserData': 'Benutzerdaten lesen',
    'edit': 'Berechtigungsbereich bearbeiten',
    'add': 'Berechtigungsbereich hinzufügen',
    'save': 'Speichern',
    'required': 'Der Name des Berechtigungsbereichs ist erforderlich.',
    'duplicate': 'Ein Berechtigungsbereich mit dem Namen „{name}“ existiert bereits.',
  },
  'oauthScopesInput': {
    'noScopesDefined': 'Keine Berechtigungsbereiche definiert',
    'addScope': 'Berechtigungsbereich hinzufügen',
    'deselectAll': 'Auswahl aufheben',
    'selectAll': 'Alle auswählen',
    'selectedScopes': 'Ausgewählte Berechtigungsbereiche: {count} / {total}',
    'editScope': '{name} bearbeiten',
    'deleteScope': '{name} löschen',
    'selectScope': 'Berechtigungsbereich {name} auswählen',
  },
  'openIdConnect': {
    'discoveryUrl': 'Discovery-URL',
    'fetchConfiguration': 'Konfiguration abrufen',
    'failedToFetchConfiguration': 'OpenID-Connect-Konfiguration konnte nicht abgerufen werden',
  },
  'requestAuthDataTable': {
    'noauthenticationSelected': 'Keine Authentifizierung ausgewählt',
  },
  'requestAuthTab': {
    'token': 'Token',
    'bearerToken': 'Bearer-Token',
    'getAToken': 'Token abrufen',
    'refresh': 'Aktualisieren',
    'username': 'Benutzername',
    'password': 'Passwort',
    'name': 'Name',
    'value': 'Wert',
    'cancel': 'Abbrechen',
    'authorize': 'Autorisieren',
    'unsupportedCredentials':
      'Zugangsdaten für dieses AsyncAPI-Sicherheitsschema werden vom Browser-Client nicht gesendet.',
    'authorizeVia': 'Über {name} autorisieren',
    'unsupportedType': 'Der Sicherheitsschematyp {type} wird noch nicht unterstützt.',
    'missingType':
      'Dem Sicherheitsschema fehlt ein Typ. Prüfen Sie Ihr {type}-Dokument oder die Authentifizierungskonfiguration.',
    'failedToauthorize': 'Autorisierung fehlgeschlagen',
    'failedToRefresh': 'Aktualisierung fehlgeschlagen',
    'configure': '{name} konfigurieren',
    'mutualTlsHint':
      'Gegenseitiges TLS authentifiziert mit einem Client-Zertifikat, das beim TLS-Handshake übermittelt wird. Hier ist keine Eingabe erforderlich.',
  },
  'commandActionForm': {
    'continue': 'Weiter',
  },
  'environment': {
    'thisIsTheActiveEnvironment': 'Dies ist die aktive Umgebung',
    'active': 'Aktiv',
    'editEnvironment': 'Umgebung bearbeiten',
    'deleteEnvironment': 'Umgebung löschen',
  },
  'environmentCreateModal': {
    'environmentName': 'Umgebungsname',
    'thisEnvironmentNameIsAlreadyInUse': 'Dieser Umgebungsname wird bereits verwendet.',
    'update': 'Umgebung aktualisieren',
    'add': 'Umgebung hinzufügen',
  },
  'environmentDeleteModal': {
    'cancel': 'Abbrechen',
    'deleteEnvironment': 'Umgebung löschen',
    'deleteConfirmation':
      'Möchten Sie diese Umgebung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    'title': '{name} löschen',
  },
  'environmentVariablesDropdown': {
    'variableSuggestions': 'Variablenvorschläge',
    'addVariable': 'Variable hinzufügen',
  },
  'environmentVariablesTable': {
    'name': 'Name',
    'value': 'Wert',
    'actions': 'Aktionen',
    'environmentVariableName': 'Name der Umgebungsvariable',
    'environmentVariableValue': 'Wert der Umgebungsvariable',
  },
  'documentSearchModal': {
    'documentSearch': 'Dokumentsuche',
    'documentSearchResults': 'Ergebnisse der Dokumentsuche',
    'navigate': '↑↓ Navigieren',
    'select': '⏎ Auswählen',
    'keyboardInstructions':
      'Drücken Sie Pfeil nach oben oder unten zum Navigieren, Enter zum Auswählen und tippen Sie zum Filtern der Ergebnisse',
  },
  'searchResult': {
    'httpMethod': 'HTTP-Methode:',
    'path': 'Pfad:',
    'description': 'Beschreibung:',
    'heading': 'Überschrift',
    'operation': 'Operation',
    'tag': 'Tag',
  },
  'sectionFilter': {
    'all': 'Alle',
    'auth': 'Authentifizierung',
    'variables': 'Variablen',
    'cookies': 'Cookies',
    'headers': 'Header',
    'query': 'Abfrage',
    'body': 'Inhalt',
  },
  'requestParams': {
    'clearAll': 'Alle {title} leeren',
    'clear': 'Leeren',
    'clearOptionalParameters': 'Optionale Parameter leeren',
  },
  'responseBodyDownload': {
    'download': 'Antwortinhalt herunterladen',
    'label': 'Herunterladen',
    'body': 'Antwortinhalt',
  },
  'responseMetaInformation': {
    'duration': 'Antwortinformationen, Dauer:',
    'size': ', Größe:',
    'status': ', Status:',
  },
  'authSelector': {
    'selectedType': 'Ausgewählter Authentifizierungstyp: {type}',
    'multipleTypes': 'Mehrere Authentifizierungstypen ausgewählt',
    'selectType': 'Authentifizierungstyp auswählen',
    'optional': 'Optional',
    'required': 'Erforderlich',
    'deleteScheme': '{name} löschen',
    'requiredGroup': 'Erforderliche Authentifizierung',
    'availableGroup': 'Verfügbare Authentifizierung',
    'addGroup': 'Neue Authentifizierung hinzufügen',
  },
  'operationBlock': {
    'webhookUrlRequired': 'Webhook-URL erforderlich. Geben Sie zuerst ein Ziel ein.',
    'pathParametersRequired': 'Pfadparameter müssen Werte haben.',
    'forbiddenMethod': 'Die Fetch-API kann keine {method}-Anfragen senden.',
  },
  'dataTableCheckbox': {
    'toggle': 'Umschalten',
  },
  'pillTooltipHost': {
    'computedAtExecution': 'Wird bei der Anfrageausführung berechnet',
    'noValue': 'Kein Wert',
  },
  'authOptions': {
    oauth2DeviceAuthorization: 'OAuth2-Geräteautorisierung',
    'apiKeyCookie': 'API-Schlüssel in Cookies',
    'apiKeyHeader': 'API-Schlüssel in Headern',
    'apiKeyQuery': 'API-Schlüssel in Abfrageparametern',
    'httpBasic': 'HTTP Basic',
    'httpBearer': 'HTTP Bearer',
    'oauth2Implicit': 'Impliziter OAuth2-Ablauf',
    'oauth2Password': 'OAuth2-Passwortablauf',
    'oauth2ClientCredentials': 'OAuth2-Client-Zugangsdaten',
    'oauth2AuthorizationFlow': 'OAuth2-Autorisierungscode',
  },
  'deleteSidebarListElement': {
    'delete': '{name} löschen',
  },
  'deleteModal': {
    'delete': '{name} löschen',
  },
} satisfies ApiClientTranslations
