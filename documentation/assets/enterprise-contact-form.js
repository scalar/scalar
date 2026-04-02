const initEnterpriseContactForm = () => {
  const setFeedback = (feedback, message, type) => {
    if (!(feedback instanceof HTMLElement)) {
      return
    }
    feedback.textContent = message
    feedback.classList.remove('is-success', 'is-error')
    if (type) {
      feedback.classList.add(type)
    }
  }

  const setSuccessState = (form, visible) => {
    const successPanel = document.getElementById('enterprise-demo-success')
    if (!(successPanel instanceof HTMLElement)) {
      return
    }

    form.classList.toggle('is-success-hidden', visible)
    successPanel.classList.toggle('is-visible', visible)
  }

  const HELP_CHECKBOX_NAME = 'howCanWeHelp'

  const syncHelpSelectionValidation = (form) => {
    const helpCheckboxes = form.querySelectorAll(`input[name="${HELP_CHECKBOX_NAME}"]`)
    if (!helpCheckboxes.length) {
      return
    }

    const hasSelection = Array.from(helpCheckboxes).some(
      (checkbox) => checkbox instanceof HTMLInputElement && checkbox.checked,
    )

    helpCheckboxes.forEach((checkbox) => {
      if (checkbox instanceof HTMLInputElement) {
        checkbox.required = !hasSelection
      }
    })
  }

  const createNotes = (formData) => {
    const getValue = (name) => {
      const value = formData.get(name)
      return typeof value === 'string' ? value.trim() : ''
    }

    const selectedHelpOptions = formData
      .getAll(HELP_CHECKBOX_NAME)
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)

    return [
      `Job title: ${getValue('jobTitle')}`,
      `Company name: ${getValue('companyName')}`,
      `How can we help: ${selectedHelpOptions.join(', ')}`,
      `Additional context: ${getValue('additionalContext')}`,
    ]
      .filter((line) => !line.endsWith(': '))
      .join('\n')
  }

  const handleSubmit = async (event, form) => {
    if (form.dataset.submitting === 'true') {
      event.preventDefault()
      return
    }

    event.preventDefault()

    const feedback = form.querySelector('.enterprise-demo-feedback')
    const submitButton = form.querySelector('.enterprise-demo-submit')

    setSuccessState(form, false)
    setFeedback(feedback, '', '')
    form.dataset.submitting = 'true'
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true
      submitButton.textContent = 'Submitting...'
    }

    const formData = new FormData(form)
    const body = new URLSearchParams()

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        body.append(key, value)
      }
    }

    const notes = createNotes(formData)
    if (notes) {
      body.set('notes', notes)
    }

    const submitUrl = form.dataset.submitUrl || form.getAttribute('action') || ''

    if (!submitUrl || submitUrl.startsWith('#')) {
      setFeedback(feedback, 'Form endpoint is unavailable. Please try again later.', 'is-error')
      return
    }

    try {
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      let data = null
      try {
        data = await response.json()
      } catch (_error) {
        data = null
      }

      if (response.status === 429) {
        setFeedback(feedback, 'Too many submissions. Please try again in a little while.', 'is-error')
        return
      }

      if (!response.ok || data?.success === false) {
        setFeedback(feedback, data?.message || 'Something went wrong. Please try again.', 'is-error')
        return
      }

      setFeedback(feedback, '', '')
      setSuccessState(form, true)
      form.reset()
      syncHelpSelectionValidation(form)
    } catch (_error) {
      setFeedback(feedback, 'Network error. Please try again in a moment.', 'is-error')
    } finally {
      form.dataset.submitting = 'false'
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false
        submitButton.textContent = 'Submit request'
      }
    }
  }

  document.querySelectorAll('.enterprise-demo-form').forEach((form) => {
    if (!(form instanceof HTMLFormElement)) {
      return
    }
    if (form.dataset.loopsBoundDirect === 'true') {
      return
    }
    form.addEventListener('submit', async (event) => {
      await handleSubmit(event, form)
    })

    form.addEventListener('change', (event) => {
      const input = event.target
      if (!(input instanceof HTMLInputElement) || input.name !== HELP_CHECKBOX_NAME) {
        return
      }
      syncHelpSelectionValidation(form)
    })

    syncHelpSelectionValidation(form)
    form.dataset.loopsBoundDirect = 'true'
  })

  if (document.documentElement.dataset.enterpriseLoopsListener !== 'true') {
    document.addEventListener(
      'submit',
      async (event) => {
        const form = event.target
        if (!(form instanceof HTMLFormElement)) {
          return
        }
        if (!form.matches('.enterprise-demo-form')) {
          return
        }

        await handleSubmit(event, form)
      },
      true,
    )
    document.documentElement.dataset.enterpriseLoopsListener = 'true'
    console.log('Initialized enterprise contact form submit listener')
  }

  if (document.documentElement.dataset.enterpriseResetListener !== 'true') {
    document.addEventListener(
      'click',
      (event) => {
        const resetButton = event.target instanceof Element ? event.target.closest('#enterprise-demo-reset') : null
        if (!(resetButton instanceof HTMLElement)) {
          return
        }

        const form = document.querySelector('.enterprise-demo-form')
        if (!(form instanceof HTMLFormElement)) {
          return
        }

        const feedback = form.querySelector('.enterprise-demo-feedback')
        setFeedback(feedback, '', '')
        setSuccessState(form, false)
        form.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
      true,
    )
    document.documentElement.dataset.enterpriseResetListener = 'true'
  }
}

initEnterpriseContactForm()

const observer = new MutationObserver((records) => {
  if (!records.some((record) => record.addedNodes.length)) {
    return
  }

  initEnterpriseContactForm()
})

observer.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true,
})
