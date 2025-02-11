document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('[data-type-form]')
  if (!form) return

  // Update form action when radio selection changes
  form.addEventListener('change', function(event) {
    if (event.target.type === 'radio') {
      form.action = `/question-editor/new/${event.target.value}`
    }
  })

  // Prevent form submission if no type selected
  form.addEventListener('submit', function(event) {
    const selectedType = form.querySelector('input[name="type"]:checked')
    if (!selectedType) {
      event.preventDefault()
      const errorMessage = document.createElement('div')
      errorMessage.className = 'govuk-error-message'
      errorMessage.innerHTML = '<span class="govuk-visually-hidden">Error:</span> Select a field type'
      
      const formGroup = form.querySelector('.govuk-form-group')
      if (!formGroup.querySelector('.govuk-error-message')) {
        formGroup.classList.add('govuk-form-group--error')
        formGroup.insertBefore(errorMessage, formGroup.querySelector('.govuk-radios'))
      }
    }
  })
})
