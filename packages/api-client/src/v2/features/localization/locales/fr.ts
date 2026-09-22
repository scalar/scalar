import type { ApiClientTranslations } from '@scalar/types/api-reference'

/** Built-in API Client translations for fr. */
export const fr = {
  'serverVariablesSelect': {
    'selected': 'Sélectionné :',
  },
  'serverVariablesTextbox': {
    'value': 'valeur',
  },
  'sidebarListElementForm': {
    'cancel': 'Annuler',
  },
  'requestBlock': {
    'authentication': 'Authentification',
    'variables': 'Variables',
    'cookies': 'Cookies',
    'headers': 'En-têtes',
    'queryParameters': 'Paramètres de requête',
    'requestBody': 'Corps de la requête',
    'requestName': 'Nom de la requête',
    'label': 'Requête : {name}',
  },
  'responseBlock': {
    'response': 'Réponse',
    'requestHeaders': 'En-têtes de la requête',
    'responseHeaders': 'En-têtes de la réponse',
    'body': 'Corps',
  },
  'codeInput': {
    'required': 'Obligatoire',
    'exitHint': 'Appuyez sur {escape} puis sur {tab} pour quitter',
  },
  'codeInputLite': {
    'required': 'Obligatoire',
  },
  'dataTableInput': {
    'clearValue': 'Effacer la valeur',
    'showPassword': 'Afficher le mot de passe',
    'hidePassword': 'Masquer le mot de passe',
  },
  'dataTableInputSelect': {
    'value': 'Valeur',
    'addValue': 'Ajouter une valeur',
  },
  'confirmationForm': {
    'cancel': 'Annuler',
    'save': 'Enregistrer',
  },
  'collapsibleSection': {
    'collapsed': '(Réduit)',
    'item': 'Élément',
    'items': 'Éléments',
  },
  'modalClientContainer': {
    'label': 'Client API',
  },
  'serverDropdown': {
    'server': 'Serveur :',
    'addServer': 'Ajouter un serveur',
    'updateServers': 'Mettre à jour les serveurs',
    'unknownServer': 'Serveur inconnu',
  },
  'sidebar': {
    'search': 'Rechercher',
  },
  'sidebarMenu': {
    'settings': 'Paramètres',
  },
  'sidebarToggle': {
    'hide': 'Masquer la barre latérale',
    'show': 'Afficher la barre latérale',
  },
  'environmentsList': {
    'addEnvironment': 'Ajouter un environnement',
  },
  'modal': {
    'noDocumentSelected': 'Aucun document sélectionné',
  },
  'operation': {
    'selectAnOperationToViewDetails': 'Sélectionnez une opération pour afficher ses détails',
  },
  'header': {
    'operationSettings': 'Paramètres de l’opération',
    'closeClient': 'Fermer le client',
  },
  'openApiClientButton': {
    'openAPIClient': 'Ouvrir le client API',
  },
  'requestBody': {
    'noBody': 'Aucun corps',
    'delete': 'Supprimer',
    'selectFile': 'Sélectionner un fichier',
    'multipartForm': 'Formulaire multipartie',
    'formUrlEncoded': 'Formulaire encodé en URL',
    'binaryFile': 'Fichier binaire',
    'other': 'Autre',
    'none': 'Aucun',
  },
  'requestBodyStructured': {
    'body': 'Corps',
  },
  'requestBodyViewToggle': {
    'form': 'Formulaire',
    'raw': 'Brut',
    'fixBody': 'Corrigez le corps pour passer à la vue formulaire',
  },
  'requestCodeSnippet': {
    'codeSnippet': 'Extrait de code',
  },
  'requestTable': {
    'enabled': 'Activé',
    'key': 'Clé',
    'value': 'Valeur',
  },
  'requestTableRow': {
    'key': 'Clé',
    'value': 'Valeur',
    'delete': 'Supprimer',
    'selectFile': 'Sélectionner un fichier',
    'globalCookieHint': 'Les cookies globaux sont partagés dans tout l’espace de travail. Cliquez pour y accéder.',
    'readOnlyHint':
      'Cette propriété est en lecture seule. Pour la modifier, vous devez la remplacer ou la désactiver à l’aide de la case à cocher.',
    'include': 'Inclure {name} dans la requête',
    'keyLabel': 'Clé de {name}',
    'valueLabel': 'Valeur de {name}',
    'deleteRow': 'Supprimer {name}',
    'row': 'ligne',
  },
  'requestTableTooltip': {
    'min': 'min. :',
    'max': 'max. :',
    'default': 'par défaut :',
    'invalid': 'La saisie est invalide',
    'moreInformation': 'Plus d’informations',
  },
  'headers': {
    'headerKey': 'Clé de l’en-tête',
    'headerValue': 'Valeur de l’en-tête',
    'noHeaders': 'Aucun en-tête',
  },
  'responseBody': {
    'binaryFile': 'Fichier binaire',
  },
  'responseBodyPreview': {
    'previewUnavailable': 'Aperçu indisponible',
  },
  'responseBodyStreaming': {
    'body': 'Corps',
    'listening': 'En écoute…',
    'cancel': 'Annuler',
  },
  'responseBodyToggle': {
    'preview': 'Aperçu',
    'raw': 'Brut',
  },
  'responseBodyVirtual': {
    'body': 'Corps',
    'largeBodyHint': 'Le corps de cette réponse est trop volumineux pour la coloration syntaxique.',
  },
  'responseCookies': {
    'cookies': 'Cookies',
    'cookieName': 'Nom du cookie',
    'cookieValue': 'Valeur du cookie',
    'noCookies': 'Aucun cookie',
  },
  'responseEmpty': {
    'roadmap': 'Feuille de route',
    'poweredByScalarcom': 'Propulsé par Scalar.com',
    'getStarted': 'Commencer',
    'newRequest': 'Nouvelle requête',
    'sendRequest': 'Envoyer la requête',
    'version': 'Scalar App V{version} Beta',
  },
  'responseLoadingOverlay': {
    'cancel': 'Annuler',
  },
  'addressBar': {
    'path': 'Chemin',
    'copyUrl': 'Copier l’URL',
    'send': 'Envoyer',
    'sendRequest': 'Envoyer une requête {method} à {url}',
    'duplicateRequest': 'Une requête {method} vers {path} existe déjà dans ce document',
    'urlPlaceholder': 'Saisissez une URL',
    'webhookUrlPlaceholder': 'Saisissez l’URL complète du webhook, par exemple https://example.com/hook',
  },
  'addressBarHistory': {
    'requestHistory': 'Historique des requêtes',
  },
  'environmentSelector': {
    'noEnvironment': 'Aucun environnement',
    'notAvailableInThisContext': 'Indisponible dans ce contexte',
    'environmentHint':
      'Les environnements permettent de gérer des variables comme les clés API et les URL de base dans différents contextes.',
    'add': 'Ajouter un environnement',
    'select': 'Sélectionner un environnement',
    'unavailable': '{name} (Indisponible)',
    'current': 'Environnement actuel : {name}',
  },
  'deleteRequestAuthModal': {
    'deleteSecurityScheme': 'Supprimer le schéma de sécurité',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'confirmation':
      'Cette action est irréversible. Vous allez supprimer le schéma de sécurité {name} de la collection.',
  },
  'oauth2': {
    deviceAuthorizationUrl: 'URL d’autorisation du périphérique',
    deviceVerificationPrompt: 'Ouvrez la page de vérification et saisissez ce code :',
    waitingForAuthorization: 'En attente d’autorisation…',
    cancelDeviceAuthorization: 'Annuler',

    'accessToken': 'Jeton d’accès',
    'refreshUrl': 'URL de renouvellement',
    'refresh': 'Actualiser',
    'authUrl': 'URL d’authentification',
    'tokenUrl': 'URL du jeton',
    'redirectUrl': 'URL de redirection',
    'username': 'Nom d’utilisateur',
    'password': 'Mot de passe',
    'clientID': 'Identifiant du client',
    'clientSecret': 'Secret du client',
    'usePKCE': 'Utiliser PKCE',
    'credentialsLocation': 'Emplacement des identifiants',
    'authorize': 'Autoriser',
    'clear': 'Effacer',
    'failedToauthorize': 'Échec de l’autorisation',
    'failedToRefreshToken': 'Échec du renouvellement du jeton',
    'optionalRedirectUrl': 'URL de redirection facultative',
  },
  'oauthScopesAddModal': {
    'name': 'Nom :',
    'description': 'Description :',
    'readUserData': 'Lire les données de l’utilisateur',
    'edit': 'Modifier la portée',
    'add': 'Ajouter une portée',
    'save': 'Enregistrer',
    'required': 'Le nom de la portée est obligatoire.',
    'duplicate': 'Une portée nommée « {name} » existe déjà.',
  },
  'oauthScopesInput': {
    'noScopesDefined': 'Aucune portée définie',
    'addScope': 'Ajouter une portée',
    'deselectAll': 'Tout désélectionner',
    'selectAll': 'Tout sélectionner',
    'selectedScopes': 'Portées sélectionnées : {count} / {total}',
    'editScope': 'Modifier {name}',
    'deleteScope': 'Supprimer {name}',
    'selectScope': 'Sélectionner la portée {name}',
  },
  'openIdConnect': {
    'discoveryUrl': 'URL de découverte',
    'fetchConfiguration': 'Récupérer la configuration',
    'failedToFetchConfiguration': 'Échec de la récupération de la configuration OpenID Connect',
  },
  'requestAuthDataTable': {
    'noauthenticationSelected': 'Aucune authentification sélectionnée',
  },
  'requestAuthTab': {
    'token': 'Jeton',
    'bearerToken': 'Jeton Bearer',
    'getAToken': 'Obtenir un jeton',
    'refresh': 'Actualiser',
    'username': 'Nom d’utilisateur',
    'password': 'Mot de passe',
    'name': 'Nom',
    'value': 'Valeur',
    'cancel': 'Annuler',
    'authorize': 'Autoriser',
    'unsupportedCredentials':
      'Le client du navigateur n’envoie pas les identifiants de ce schéma de sécurité AsyncAPI.',
    'authorizeVia': 'Autoriser via {name}',
    'unsupportedType': 'Le type de schéma de sécurité {type} n’est pas encore pris en charge.',
    'missingType':
      'Le schéma de sécurité n’a pas de type. Vérifiez votre document {type} ou la configuration de l’authentification.',
    'failedToauthorize': 'Échec de l’autorisation',
    'failedToRefresh': 'Échec de l’actualisation',
    'configure': 'Configurer {name}',
    'mutualTlsHint':
      'L’authentification TLS mutuelle utilise un certificat client présenté lors de la négociation TLS. Il n’y a donc rien à saisir ici.',
  },
  'commandActionForm': {
    'continue': 'Continuer',
  },
  'environment': {
    'thisIsTheActiveEnvironment': 'Ceci est l’environnement actif',
    'active': 'Actif',
    'editEnvironment': 'Modifier l’environnement',
    'deleteEnvironment': 'Supprimer l’environnement',
  },
  'environmentCreateModal': {
    'environmentName': 'Nom de l’environnement',
    'thisEnvironmentNameIsAlreadyInUse': 'Ce nom d’environnement est déjà utilisé.',
    'update': 'Mettre à jour l’environnement',
    'add': 'Ajouter un environnement',
  },
  'environmentDeleteModal': {
    'cancel': 'Annuler',
    'deleteEnvironment': 'Supprimer l’environnement',
    'deleteConfirmation': 'Voulez-vous vraiment supprimer cet environnement ? Cette action est irréversible.',
    'title': 'Supprimer {name}',
  },
  'environmentVariablesDropdown': {
    'variableSuggestions': 'Suggestions de variables',
    'addVariable': 'Ajouter une variable',
  },
  'environmentVariablesTable': {
    'name': 'Nom',
    'value': 'Valeur',
    'actions': 'Actions',
    'environmentVariableName': 'Nom de la variable d’environnement',
    'environmentVariableValue': 'Valeur de la variable d’environnement',
  },
  'documentSearchModal': {
    'documentSearch': 'Recherche dans les documents',
    'documentSearchResults': 'Résultats de la recherche dans les documents',
    'navigate': '↑↓ Naviguer',
    'select': '⏎ Sélectionner',
    'keyboardInstructions':
      'Utilisez les flèches haut et bas pour naviguer, Entrée pour sélectionner et saisissez du texte pour filtrer les résultats',
  },
  'searchResult': {
    'httpMethod': 'Méthode HTTP :',
    'path': 'Chemin :',
    'description': 'Description :',
    'heading': 'Titre',
    'operation': 'Opération',
    'tag': 'Étiquette',
  },
  'sectionFilter': {
    'all': 'Tout',
    'auth': 'Authentification',
    'variables': 'Variables',
    'cookies': 'Cookies',
    'headers': 'En-têtes',
    'query': 'Requête',
    'body': 'Corps',
  },
  'requestParams': {
    'clearAll': 'Tout effacer : {title}',
    'clear': 'Effacer',
    'clearOptionalParameters': 'Effacer les paramètres facultatifs',
  },
  'responseBodyDownload': {
    'download': 'Télécharger le corps de la réponse',
    'label': 'Télécharger',
    'body': 'Corps de la réponse',
  },
  'responseMetaInformation': {
    'duration': 'Informations de la réponse, durée :',
    'size': ', taille :',
    'status': ', statut :',
  },
  'authSelector': {
    'selectedType': 'Type d’authentification sélectionné : {type}',
    'multipleTypes': 'Plusieurs types d’authentification sélectionnés',
    'selectType': 'Sélectionner le type d’authentification',
    'optional': 'Facultatif',
    'required': 'Obligatoire',
    'deleteScheme': 'Supprimer {name}',
    'requiredGroup': 'Authentification obligatoire',
    'availableGroup': 'Authentification disponible',
    'addGroup': 'Ajouter une authentification',
  },
  'operationBlock': {
    'webhookUrlRequired': 'L’URL du webhook est obligatoire. Saisissez d’abord une destination.',
    'pathParametersRequired': 'Les paramètres de chemin doivent avoir des valeurs.',
  },
  'dataTableCheckbox': {
    'toggle': 'Basculer',
  },
  'pillTooltipHost': {
    'computedAtExecution': 'Calculé lors de l’exécution de la requête',
    'noValue': 'Aucune valeur',
  },
  'authOptions': {
    oauth2DeviceAuthorization: 'Autorisation de périphérique OAuth2',
    'apiKeyCookie': 'Clé API dans les cookies',
    'apiKeyHeader': 'Clé API dans les en-têtes',
    'apiKeyQuery': 'Clé API dans les paramètres de requête',
    'httpBasic': 'HTTP Basic',
    'httpBearer': 'HTTP Bearer',
    'oauth2Implicit': 'Flux implicite OAuth2',
    'oauth2Password': 'Flux de mot de passe OAuth2',
    'oauth2ClientCredentials': 'Identifiants client OAuth2',
    'oauth2AuthorizationFlow': 'Code d’autorisation OAuth2',
  },
  'deleteSidebarListElement': {
    'delete': 'Supprimer {name}',
  },
  'deleteModal': {
    'delete': 'Supprimer {name}',
  },
} satisfies ApiClientTranslations
