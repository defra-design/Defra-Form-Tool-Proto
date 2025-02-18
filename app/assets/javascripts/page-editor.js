// Initialize GOVUK namespace
window.GOVUK = window.GOVUK || {}
window.GOVUK.Prototype = window.GOVUK.Prototype || {}

;(function(Prototype) {
  function PageEditor($module) {
    this.$module = $module
    this.pageId = this.getPageId()
    this.setupEventListeners()
    this.loadPageData()
  }

  PageEditor.prototype.getPageId = function() {
    // Get from path - format: /page-editor/PAGE_ID
    const pathMatch = window.location.pathname.match(/\/page-editor\/([^/]+)/)
    console.log('Path match:', pathMatch)
    
    if (pathMatch) {
      return pathMatch[1]
    }
    
    // Fallback to query param
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('pageId')
  }

  PageEditor.prototype.moveQuestion = function(questionId, newPosition) {
    console.log('Moving question:', questionId, 'to position:', newPosition)
    const pageData = JSON.parse(localStorage.getItem(this.pageId) || '{}')
    if (!pageData.questions) return

    // Ensure questions have positions
    pageData.questions = pageData.questions.map((q, i) => ({ ...q, position: q.position || i }))

    // Find the question to move
    const questionToMove = pageData.questions.find(q => {
      const qId = 'form_' + q.id.replace(/^(form_)+/, '')
      const targetId = questionId.replace(/^(form_)+/, '')
      return qId === 'form_' + targetId
    })

    if (!questionToMove) return

    // Update positions
    const oldPosition = questionToMove.position
    newPosition = Math.max(0, Math.min(newPosition, pageData.questions.length - 1))

    pageData.questions.forEach(q => {
      if (q === questionToMove) {
        q.position = newPosition
      } else if (oldPosition < newPosition && q.position > oldPosition && q.position <= newPosition) {
        q.position--
      } else if (oldPosition > newPosition && q.position < oldPosition && q.position >= newPosition) {
        q.position++
      }
    })

    // Sort by position
    pageData.questions.sort((a, b) => a.position - b.position)

    // Save and refresh
    localStorage.setItem(this.pageId, JSON.stringify(pageData))
    this.loadPageData()
  }

  PageEditor.prototype.loadPageData = function() {
    try {
      console.log('Loading page data for pageId:', this.pageId);
      const pageData = JSON.parse(localStorage.getItem(this.pageId) || '{}')
      console.log('Raw page data:', pageData);

      // Clean up questions array - remove any invalid entries
      if (pageData.questions) {
        console.log('Before cleanup:', pageData.questions);
        pageData.questions = pageData.questions.filter(q => {
          const isValid = q && q.id && q.fieldType;
          console.log('Question validation:', { q, isValid });
          return isValid;
        });
        console.log('After cleanup:', pageData.questions);
        localStorage.setItem(this.pageId, JSON.stringify(pageData))
      }

      // Update page title
      const titleHeading = document.querySelector('[data-page-title]')
      if (titleHeading && pageData?.title) {
        titleHeading.textContent = `Edit "${pageData.title}"`
      }

      // Load and display questions
      const questions = this.loadQuestions(pageData)
      console.log('Loaded questions:', questions);
      this.displayFields(questions)
    } catch (error) {
      console.error('Error loading page data:', error)
    }
  }

  PageEditor.prototype.loadQuestions = function(pageData) {
    if (!pageData || !Array.isArray(pageData.questions)) return []

    // Clean and sort questions
    const questions = pageData.questions
      .filter(q => q && q.id && q.fieldType)
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    // Load stored data for each question
    return questions.map(question => {
      const cleanId = 'form_' + question.id.replace(/^(form_)+/, '')
      const storedData = JSON.parse(localStorage.getItem(cleanId) || '{}')
      
      return {
        ...storedData,
        ...question,
        id: cleanId,
        key: cleanId,
        type: storedData.type || question.type,
        title: storedData.title || question.title
      }
    })
  }

  PageEditor.prototype.displayFields = function(questions) {
    const tbody = document.querySelector('[data-questions-table] tbody')
    const previewPane = document.getElementById('page-preview')
    if (!tbody || !previewPane) return

    // Clear both the table and preview
    tbody.innerHTML = ''
    previewPane.innerHTML = ''

    // Filter out invalid questions
    const questionArray = (Array.isArray(questions) ? questions : [])
      .filter(q => q && q.id && q.fieldType)

    if (!questionArray.length) {
      tbody.innerHTML = `
        <tr class="govuk-table__row">
          <td class="govuk-table__cell" colspan="4">
            <p class="govuk-body govuk-!-margin-0">No fields added yet. Choose a field type above to add your first field.</p>
          </td>
        </tr>
      `
      previewPane.innerHTML = `
        <div class="govuk-body">
          <p>No fields added yet. Your form preview will appear here.</p>
        </div>
      `
      return
    }

    // Create preview container
    const previewContainer = document.createElement('div')
    previewContainer.className = 'govuk-!-margin-bottom-6'
    
    // Add page title if available
    const pageData = JSON.parse(localStorage.getItem(this.pageId) || '{}')
    if (pageData.title) {
      const heading = document.createElement('h1')
      heading.className = 'govuk-heading-l'
      heading.textContent = pageData.title
      previewContainer.appendChild(heading)
    }

    // Add questions to preview
    questionArray.forEach(question => {
      const preview = this.generatePreview(question)
      if (preview) {
        previewContainer.appendChild(preview)
      }
    })

    // Add preview to page
    previewPane.appendChild(previewContainer)

    // Add table rows
    tbody.innerHTML = ''
    questionArray.forEach((question, index) => {
      const cleanId = question.id.replace(/^(form_)+/, '')
      const fieldTypeDisplay = (question.fieldType || 'Unknown')
        .charAt(0).toUpperCase() + 
        (question.fieldType || 'Unknown').slice(1)
      
      const editUrl = `/question-editor/${question.fieldType}/form_${cleanId}?pageId=${this.pageId}`
      const title = question.title || 'Untitled'
      
      const row = document.createElement('tr')
      row.className = 'govuk-table__row'
      row.setAttribute('data-question-id', `form_${cleanId}`)
      row.innerHTML = `
        <td class="govuk-table__cell" style="vertical-align: middle;">
          <a href="${editUrl}" class="govuk-link">${title}</a>
        </td>
        <td class="govuk-table__cell" style="vertical-align: middle;">${fieldTypeDisplay}</td>
        <td class="govuk-table__cell" style="vertical-align: middle;">
          <div class="govuk-button-group" style="margin-bottom: 0;">
            <button type="button" class="govuk-button govuk-button--secondary govuk-button--small" data-move-up data-new-position="${index - 1}" ${index === 0 ? 'disabled' : ''}>
              ↑<span class="govuk-visually-hidden">Move up</span>
            </button>
            <button type="button" class="govuk-button govuk-button--secondary govuk-button--small" data-move-down data-new-position="${index + 1}" ${index === questionArray.length - 1 ? 'disabled' : ''}>
              ↓<span class="govuk-visually-hidden">Move down</span>
            </button>
          </div>
        </td>
        <td class="govuk-table__cell" style="vertical-align: middle; text-align: right;">
          <button type="button" class="govuk-button govuk-button--warning govuk-button--small govuk-!-margin-0" data-delete-field="form_${cleanId}">
            ×<span class="govuk-visually-hidden">Delete</span>
          </button>
        </td>
      `
      tbody.appendChild(row)
    })
  }

  PageEditor.prototype.generatePreview = function(question) {
    const container = document.createElement('div')
    
    // Use QuestionTemplates to generate the preview HTML
    if (QuestionTemplates[question.fieldType]) {
      container.innerHTML = QuestionTemplates[question.fieldType](
        question,
        question.title || 'Untitled Question',
        question.hint
      )
    } else {
      // Fallback for unknown field types
      container.className = 'govuk-form-group'
      const title = document.createElement('label')
      title.className = 'govuk-label govuk-label--l'
      title.textContent = question.title || 'Untitled Question'
      container.appendChild(title)

      if (question.hint) {
        const hint = document.createElement('div')
        hint.className = 'govuk-hint'
        hint.textContent = question.hint
        container.appendChild(hint)
      }
    }

    return container
  }

  PageEditor.prototype.setupEventListeners = function() {
    console.log('Setting up event listeners')
    const tbody = document.querySelector('[data-questions-table] tbody')
    if (!tbody) {
      console.error('Could not find questions table')
      return
    }

    // Handle clicks on the table
    tbody.addEventListener('click', (e) => {
      console.log('Table clicked:', e.target)
      const deleteBtn = e.target.closest('[data-delete-field]')
      const moveBtn = e.target.closest('[data-move-up], [data-move-down]')

      if (deleteBtn) {
        e.preventDefault()
        const fieldId = deleteBtn.dataset.deleteField
        if (confirm('Are you sure you want to delete this field?')) {
          localStorage.removeItem(fieldId)
          this.loadPageData()
        }
      } 
      else if (moveBtn && !moveBtn.disabled) {
        e.preventDefault()
        const row = e.target.closest('tr')
        if (!row) return

        const questionId = row.dataset.questionId
        const newPosition = parseInt(moveBtn.dataset.newPosition)
        console.log('Moving question:', questionId, 'to position:', newPosition)
        this.moveQuestion(questionId, newPosition)
      }
    })

    // Add field button
    const addBtn = document.querySelector('[data-add-field]')
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        window.location.href = `/field-types?pageId=${this.pageId}`
      })
    }

    // Save button
    const saveBtn = document.querySelector('[data-save]')
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault()
        window.location.href = '/pages'
      })
    }
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const pageEditor = document.querySelector('[data-module="page-editor"]')
    if (pageEditor) {
      const editor = new PageEditor(pageEditor)
      editor.loadPageData()
      editor.setupEventListeners()
    }
  })
})(window.GOVUK.Prototype)

