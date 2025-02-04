// app/assets/javascripts/questions.js

window.GOVUKPrototype = window.GOVUKPrototype || {}

;(function(Prototype) {
  function QuestionsList($module) {
    this.$module = $module
    this.$tbody = $module.querySelector('.govuk-table__body')
    this.$clearButton = document.querySelector('[data-clear-fields]')
    
    // Get the page ID from the URL
    const urlParams = new URLSearchParams(window.location.search)
    this.pageId = urlParams.get('pageId')
  }

  QuestionsList.prototype.init = function() {
    if (!this.$module || !this.pageId) return

    // Load questions from localStorage
    this.loadQuestions()

    // Set up delete handlers
    this.$module.addEventListener('click', (event) => {
      const deleteLink = event.target.closest('[data-delete]')
      if (!deleteLink) return

      event.preventDefault()
      
      if (confirm('Are you sure you want to delete this question? This cannot be undone.')) {
        const questionId = deleteLink.dataset.questionId
        this.deleteQuestion(questionId)
      }
    })

    // Add event listener for clear button
    if (this.$clearButton) {
      this.$clearButton.addEventListener('click', () => {
        this.clearAllFields()
      })
    }
  }

  QuestionsList.prototype.loadQuestions = function() {
    const questions = Object.keys(localStorage)
      .filter(key => key.startsWith('form_'))
      .map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          
          // Skip if not a valid question or not for this page
          if (!data || !data.id || !data.fieldType || data.pageId !== this.pageId) {
            return null
          }

          // Extract timestamp from question ID or use current time as fallback
          const timestamp = data.id.includes('_') 
            ? parseInt(data.id.split('_')[2]) || Date.now() 
            : Date.now()

          return {
            ...data,
            timestamp: timestamp
          }
        } catch (e) {
          console.error('Error parsing question:', key, e)
          return null
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp (newest first)

    if (questions.length > 0) {
      this.renderQuestions(questions)
    } else {
      this.renderEmptyState()
    }
  }

  QuestionsList.prototype.renderQuestions = function(questions) {
    if (!this.$tbody) return

    const rows = questions.map(question => {
      // Safely get the field type display name
      const fieldType = question.fieldType || 'Unknown'
      const fieldTypeDisplay = fieldType.charAt(0).toUpperCase() + fieldType.slice(1)

      // Safely get the question title
      const title = question.title || 'Untitled question'

      return `
        <tr class="govuk-table__row">
          <td class="govuk-table__cell">${title}</td>
          <td class="govuk-table__cell">${fieldTypeDisplay}</td>
          <td class="govuk-table__cell">
            <a href="/question-editor/${fieldType}/${question.id}" class="govuk-link">
              Edit<span class="govuk-visually-hidden"> ${title}</span>
            </a>
          </td>
          <td class="govuk-table__cell">
            <a href="#" class="govuk-link govuk-link--danger" data-delete data-question-id="${question.id}">
              Delete<span class="govuk-visually-hidden"> ${title}</span>
            </a>
          </td>
        </tr>
      `
    }).join('')

    this.$tbody.innerHTML = rows || ''
  }

  QuestionsList.prototype.renderEmptyState = function() {
    if (!this.$tbody) return

    const row = `
      <tr class="govuk-table__row">
        <td class="govuk-table__cell" colspan="4">
          <p class="govuk-body">No questions added yet. Add your first question from the options below.</p>
        </td>
      </tr>
    `

    this.$tbody.innerHTML = row
  }

  QuestionsList.prototype.deleteQuestion = function(questionId) {
    if (!questionId) return

    localStorage.removeItem(`form_${questionId}`)
    this.loadQuestions()
  }

  QuestionsList.prototype.clearAllFields = function() {
    if (!confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
      return
    }

    // Only remove fields for the current page
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('form_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          if (data && data.pageId === this.pageId) {
            localStorage.removeItem(key)
          }
        } catch (e) {
          console.error('Error checking field:', key, e)
        }
      }
    })

    this.loadQuestions()
  }

  // Expose the QuestionsList class to the GOVUKPrototype namespace
  Prototype.QuestionsList = QuestionsList
})(window.GOVUKPrototype)