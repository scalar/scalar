/* PostHog Analytics */
!(function (t, e) {
  var o, n, p, r
  e.__SV ||
    (window.posthog && window.posthog.__loaded) ||
    ((window.posthog = e),
    (e._i = []),
    (e.init = function (i, s, a) {
      function g(t, e) {
        var o = e.split('.')
        2 == o.length && ((t = t[o[0]]), (e = o[1]))
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
        }
      }
      ;(p = t.createElement('script')).type = 'text/javascript'
      p.crossOrigin = 'anonymous'
      p.async = !0
      p.src = s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js'
      ;(r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r)
      var u = e
      for (
        void 0 !== a ? (u = e[a] = []) : (a = 'posthog'),
          (u.people = u.people || []),
          (u.toString = function (t) {
            var e = 'posthog'
            return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e
          }),
          (u.people.toString = function () {
            return u.toString(1) + '.people (stub)'
          }),
          o = 'Ii init Di qi Sr Bi Zi Pi capture calculateEventProperties Yi register register_once register_for_session unregister unregister_for_session Xi getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Ji identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty Wi Vi createPersonProfile setInternalOrTestUser Gi Fi tn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing $i debug Tr Ui getPageViewId captureTraceFeedback captureTraceMetric Ri'.split(
            ' ',
          ),
          n = 0;
        n < o.length;
        n++
      )
        g(u, o[n])
      e._i.push([i, s, a])
    }),
    (e.__SV = 1))
})(document, window.posthog || [])

window.posthog.init('phc_3elIjSOvGOo5aEwg6krzIY9IcQiRubsBtglOXsQ4Uu4', {
  api_host: 'https://magic.scalar.com',
  ui_host: 'https://us.posthog.com',
  defaults: '2026-01-30',
  person_profiles: 'identified_only',
})
