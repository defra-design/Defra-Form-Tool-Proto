;(function(Prototype) {
  // Field templates for each field type
  const fieldTemplates = {
    text: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <label class="govuk-label" for="${fieldId}">
            ${field.title || 'Untitled field'}
          </label>
          ${field.hint ? `
            <div id="${fieldId}-hint" class="govuk-hint">
              ${field.hint}
            </div>
          ` : ''}
          <input class="govuk-input" id="${fieldId}" name="${fieldId}" type="text" 
                 ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
        </div>
      `
    },

    textarea: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <label class="govuk-label" for="${fieldId}">
            ${field.title || 'Untitled field'}
          </label>
          ${field.hint ? `
            <div id="${fieldId}-hint" class="govuk-hint">
              ${field.hint}
            </div>
          ` : ''}
          <textarea class="govuk-textarea" id="${fieldId}" name="${fieldId}" rows="5"
                    ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}></textarea>
        </div>
      `
    },

    radio: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <fieldset class="govuk-fieldset" ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
            <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
              <h1 class="govuk-fieldset__heading">
                ${field.title || 'Untitled field'}
              </h1>
            </legend>
            ${field.hint ? `
              <div id="${fieldId}-hint" class="govuk-hint">
                ${field.hint}
              </div>
            ` : ''}
            <div class="govuk-radios" data-module="govuk-radios">
              ${(field.options || []).map((option, index) => `
                <div class="govuk-radios__item">
                  <input class="govuk-radios__input" id="${fieldId}-${index}" 
                         name="${fieldId}" type="radio" value="${option.value || option.text || ''}"
                         ${option.hint ? `aria-describedby="${fieldId}-${index}-hint"` : ''}>
                  <label class="govuk-label govuk-radios__label" for="${fieldId}-${index}">
                    ${option.text || ''}
                  </label>
                  ${option.hint ? `
                    <div id="${fieldId}-${index}-hint" class="govuk-hint govuk-radios__hint">
                      ${option.hint}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </fieldset>
        </div>
      `
    },

    checkbox: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <fieldset class="govuk-fieldset" ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
            <legend class="govuk-fieldset__legend">
              ${field.title || 'Untitled field'}
            </legend>
            ${field.hint ? `
              <div id="${fieldId}-hint" class="govuk-hint">
                ${field.hint}
              </div>
            ` : ''}
            <div class="govuk-checkboxes" data-module="govuk-checkboxes">
              ${(field.options || []).map((option, index) => `
                <div class="govuk-checkboxes__item">
                  <input class="govuk-checkboxes__input" id="${fieldId}-${index}" 
                         name="${fieldId}" type="checkbox" value="${option.value || option.text || ''}"
                         ${option.hint ? `aria-describedby="${fieldId}-${index}-hint"` : ''}>
                  <label class="govuk-label govuk-checkboxes__label" for="${fieldId}-${index}">
                    ${option.text || ''}
                  </label>
                  ${option.hint ? `
                    <div id="${fieldId}-${index}-hint" class="govuk-hint govuk-checkboxes__hint">
                      ${option.hint}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </fieldset>
        </div>
      `
    },

    select: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <label class="govuk-label" for="${fieldId}">
            ${field.title || 'Untitled field'}
          </label>
          ${field.hint ? `
            <div id="${fieldId}-hint" class="govuk-hint">
              ${field.hint}
            </div>
          ` : ''}
          <select class="govuk-select" id="${fieldId}" name="${fieldId}"
                  ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
            <option value="">Please select</option>
            ${(field.options || []).map(option => `
              <option value="${option.value || option.text || ''}">
                ${option.text || ''}
              </option>
            `).join('')}
          </select>
        </div>
      `
    },

    date: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <fieldset class="govuk-fieldset" role="group" 
                    ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
            <legend class="govuk-fieldset__legend">
              ${field.title || 'Untitled field'}
            </legend>
            ${field.hint ? `
              <div id="${fieldId}-hint" class="govuk-hint">
                ${field.hint}
              </div>
            ` : ''}
            <div class="govuk-date-input" id="${fieldId}">
              <div class="govuk-date-input__item">
                <div class="govuk-form-group">
                  <label class="govuk-label govuk-date-input__label" for="${fieldId}-day">Day</label>
                  <input class="govuk-input govuk-date-input__input govuk-input--width-2" 
                         id="${fieldId}-day" name="${fieldId}-day" type="text" pattern="[0-9]*" inputmode="numeric">
                </div>
              </div>
              <div class="govuk-date-input__item">
                <div class="govuk-form-group">
                  <label class="govuk-label govuk-date-input__label" for="${fieldId}-month">Month</label>
                  <input class="govuk-input govuk-date-input__input govuk-input--width-2" 
                         id="${fieldId}-month" name="${fieldId}-month" type="text" pattern="[0-9]*" inputmode="numeric">
                </div>
              </div>
              <div class="govuk-date-input__item">
                <div class="govuk-form-group">
                  <label class="govuk-label govuk-date-input__label" for="${fieldId}-year">Year</label>
                  <input class="govuk-input govuk-date-input__input govuk-input--width-4" 
                         id="${fieldId}-year" name="${fieldId}-year" type="text" pattern="[0-9]*" inputmode="numeric">
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      `
    },

    email: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <label class="govuk-label" for="${fieldId}">
            ${field.title || 'Untitled field'}
          </label>
          ${field.hint ? `
            <div id="${fieldId}-hint" class="govuk-hint">
              ${field.hint}
            </div>
          ` : ''}
          <input class="govuk-input" id="${fieldId}" name="${fieldId}" type="email" 
                 ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
        </div>
      `
    },

    tel: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <label class="govuk-label" for="${fieldId}">
            ${field.title || 'Untitled field'}
          </label>
          ${field.hint ? `
            <div id="${fieldId}-hint" class="govuk-hint">
              ${field.hint}
            </div>
          ` : ''}
          <input class="govuk-input govuk-input--width-20" id="${fieldId}" name="${fieldId}" 
                 type="tel" ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
        </div>
      `
    },

    number: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <label class="govuk-label" for="${fieldId}">
            ${field.title || 'Untitled field'}
          </label>
          ${field.hint ? `
            <div id="${fieldId}-hint" class="govuk-hint">
              ${field.hint}
            </div>
          ` : ''}
          <input class="govuk-input govuk-input--width-10" id="${fieldId}" name="${fieldId}" 
                 type="number" ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
        </div>
      `
    },

    file: function(field, fieldId) {
      return `
        <div class="govuk-form-group">
          <label class="govuk-label" for="${fieldId}">
            ${field.title || 'Untitled field'}
          </label>
          ${field.hint ? `
            <div id="${fieldId}-hint" class="govuk-hint">
              ${field.hint}
            </div>
          ` : ''}
          <input class="govuk-file-upload" id="${fieldId}" name="${fieldId}" type="file" 
                 ${field.hint ? `aria-describedby="${fieldId}-hint"` : ''}>
        </div>
      `
    }
  }

  // Initialize prototype
  Prototype.FormPreview = function($module) {
    this.$module = $module
    this.currentPage = 0
    this.pages = []
  }

  // Initialize the form preview
  Prototype.initFormPreview = function() {
    const $container = document.querySelector('[data-form-preview]')
    if ($container) {
      console.log('Found form preview container')
      const formPreview = new Prototype.FormPreview($container)
      formPreview.init()
    }
  }

  // Add to the list of components to initialize
  const oldInit = Prototype.initAll || function(){}
  Prototype.initAll = function() {
    oldInit()
    Prototype.initFormPreview()
  }

  Prototype.FormPreview.prototype.init = function() {
    // Load all pages
    this.loadPages()

    // Initial page load
    this.loadCurrentPage()

    // Set up event listeners
    const $prevButton = this.$module.querySelector('[data-prev-page]')
    const $nextButton = this.$module.querySelector('[data-next-page]')

    if ($prevButton) {
      $prevButton.addEventListener('click', () => {
        this.previousPage()
      })
    }

    if ($nextButton) {
      $nextButton.addEventListener('click', () => {
        this.nextPage()
      })
    }
  }

  Prototype.FormPreview.prototype.loadPages = function() {
    const keys = Object.keys(localStorage)
    const pages = []

    // First get all valid pages
    keys.forEach(key => {
      if (key.startsWith('page_') && !key.includes('form_')) {
        try {
          const pageData = JSON.parse(localStorage.getItem(key))
          if (pageData && pageData.id) {
            // Initialize questions array if not present
            pageData.questions = pageData.questions || []
            pages.push(pageData)
          }
        } catch (error) {
          console.error('Error parsing page data:', error)
        }
      }
    })

    // Sort pages by creation time
    pages.sort((a, b) => {
      const timeA = parseInt((a.id || '').split('_')[1]) || 0
      const timeB = parseInt((b.id || '').split('_')[1]) || 0
      return timeA - timeB
    })

    this.pages = pages
    console.log('Loaded pages:', this.pages)
  }

  Prototype.FormPreview.prototype.loadCurrentPage = function() {
    if (!this.pages.length) return

    const currentPage = this.pages[this.currentPage]
    if (!currentPage) return

    // Update breadcrumbs
    this.updateBreadcrumbs()

    // Update page title
    const $pageTitle = this.$module.querySelector('[data-page-title]')
    if ($pageTitle) {
      $pageTitle.textContent = currentPage.title || 'Untitled Page'
    }

    // Load fields
    this.loadFields(currentPage)

    // Update navigation
    const $prevButton = this.$module.querySelector('[data-prev-page]')
    const $nextButton = this.$module.querySelector('[data-next-page]')

    if ($prevButton) {
      $prevButton.disabled = this.currentPage === 0
    }

    if ($nextButton) {
      $nextButton.disabled = this.currentPage === this.pages.length - 1
      $nextButton.textContent = this.currentPage === this.pages.length - 1 ? 'Submit' : 'Continue'
    }
  }

  Prototype.FormPreview.prototype.updateBreadcrumbs = function() {
    const $breadcrumbs = this.$module.querySelector('[data-breadcrumbs]')
    if (!$breadcrumbs) return

    const currentPage = this.pages[this.currentPage]
    if (!currentPage) return

    $breadcrumbs.innerHTML = `
      <ol class="govuk-breadcrumbs__list">
        <li class="govuk-breadcrumbs__list-item">
          <a class="govuk-breadcrumbs__link" href="/pages">Pages list</a>
        </li>
        <li class="govuk-breadcrumbs__list-item">
          Form preview
        </li>
        <li class="govuk-breadcrumbs__list-item">
          ${currentPage.title || 'Untitled Page'}
        </li>
      </ol>
    `
  }

  Prototype.FormPreview.prototype.loadFields = function(page) {
    const $fieldsContainer = this.$module.querySelector('[data-fields-container]')
    if (!$fieldsContainer) return

    // Clear existing fields
    $fieldsContainer.innerHTML = ''

    // Render each question
    if (page.questions && page.questions.length) {
      page.questions.forEach(question => {
        if (question && question.fieldType) {
          const template = fieldTemplates[question.fieldType]
          if (template) {
            const fieldId = `field_${question.id}`
            $fieldsContainer.innerHTML += template(question, fieldId)
          }
        }
      })
    } else {
      $fieldsContainer.innerHTML = '<p class="govuk-body">No questions on this page yet.</p>'
    }
  }

  Prototype.FormPreview.prototype.previousPage = function() {
    if (this.currentPage > 0) {
      this.currentPage--
      this.loadCurrentPage()
    }
  }

  Prototype.FormPreview.prototype.nextPage = function() {
    if (this.currentPage < this.pages.length - 1) {
      this.currentPage++
      this.loadCurrentPage()
    }
  }

})(window.GOVUKPrototype = window.GOVUKPrototype || {})
