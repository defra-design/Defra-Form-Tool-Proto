;(function(Prototype) {
  function PageEditor($module) {
    this.$module = $module
    
    // Try multiple methods to get the pageId
    this.pageId = this.getPageId()
    console.log('PageEditor initialized with pageId:', this.pageId)
  }

  PageEditor.prototype.getPageId = function() {
    // Try getting from URL params first
    const urlParams = new URLSearchParams(window.location.search)
    const pageId = urlParams.get('pageId')
    if (pageId) {
      console.log('Got pageId from URL:', pageId)
      return pageId
    }

    // Try getting from URL path as last resort
    const pathParts = window.location.pathname.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    if (lastPart?.startsWith('page_')) {
      console.log('Got pageId from URL path:', lastPart)
      return lastPart
    }

    console.error('Could not determine pageId from any source')
    return null
  }

  PageEditor.prototype.cleanupInvalidEntries = function() {
    console.log('Starting localStorage cleanup...')
    const keys = Object.keys(localStorage)
    const validPageIds = new Set()

    // First get all valid page IDs
    try {
      const pagesData = JSON.parse(localStorage.getItem('form_pages') || '[]')
      pagesData.forEach(page => {
        if (page.id) validPageIds.add(page.id)
      })
      console.log('Valid page IDs:', Array.from(validPageIds))
    } catch (error) {
      console.error('Error parsing form_pages:', error)
    }

    // Then clean up question entries
    keys.forEach(key => {
      if (key.startsWith('form_') && key !== 'form_pages') {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          let shouldRemove = false
          let reason = ''

          // Check for basic validity
          if (!data) {
            shouldRemove = true
            reason = 'Invalid JSON data'
          }
          // Check for required fields
          else if (!data.fieldType) {
            shouldRemove = true
            reason = 'Missing field type'
          }
          else if (!data.pageId || !validPageIds.has(data.pageId)) {
            shouldRemove = true
            reason = 'Invalid or missing page ID'
          }
          // Check title validity
          else if (!data.title || data.title.trim() === '' || data.title === 'Untitled') {
            // For fields that require options, only remove if they also have no options
            if (['radio', 'checkbox', 'select'].includes(data.fieldType)) {
              if (!data.options || data.options.length === 0) {
                shouldRemove = true
                reason = 'Empty title and no options for choice field'
              }
            } else {
              shouldRemove = true
              reason = 'Empty or untitled question'
            }
          }

          if (shouldRemove) {
            console.log(`Removing invalid entry ${key}:`, reason, data)
            localStorage.removeItem(key)
          }
        } catch (error) {
          console.error('Error processing localStorage entry:', key, error)
          localStorage.removeItem(key)
        }
      }
    })
    console.log('localStorage cleanup completed')
  }

  PageEditor.prototype.moveQuestion = function(questionId, direction) {
    // Get all questions for this page
    const questions = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('form_') && key !== 'form_pages') {
        try {
          const questionData = JSON.parse(localStorage.getItem(key))
          if (questionData.pageId === this.pageId) {
            questions.push({ ...questionData, key })
          }
        } catch (error) {
          console.error('Error parsing question data:', error)
        }
      }
    }
    
    // Sort questions by position
    questions.sort((a, b) => {
      const posA = typeof a.position === 'number' ? a.position : Infinity
      const posB = typeof b.position === 'number' ? b.position : Infinity
      return posA - posB
    })
    
    // Find current question index
    const currentIndex = questions.findIndex(q => q.key === questionId)
    if (currentIndex === -1) return
    
    // Calculate new index
    const newIndex = currentIndex + direction
    if (newIndex < 0 || newIndex >= questions.length) return
    
    // Update positions for all questions
    questions.forEach((q, i) => {
      q.position = i
    })
    
    // Swap the questions
    const temp = questions[currentIndex]
    questions[currentIndex] = questions[newIndex]
    questions[newIndex] = temp
    
    // Update positions after swap
    questions[currentIndex].position = currentIndex
    questions[newIndex].position = newIndex
    
    // Save all questions with their new positions
    questions.forEach(question => {
      localStorage.setItem(question.key, JSON.stringify(question))
    })
    
    // Refresh the display
    this.loadPageData()
  }

  PageEditor.prototype.init = function() {
    if (!this.$module) {
      console.error('Missing module')
      return
    }

    if (!this.pageId) {
      console.error('Invalid or missing pageId:', this.pageId)
      return
    }

    // Clean up invalid entries
    this.cleanupInvalidEntries()

    // Load page data
    this.loadPageData()
    this.setupEventListeners()
  }

  PageEditor.prototype.loadPageData = function() {
    try {
      console.log('Loading page data for:', this.pageId)
      const pageData = JSON.parse(localStorage.getItem(this.pageId) || '{}')
      console.log('Page data loaded:', pageData)

      // Update page title
      const titleHeading = document.querySelector('[data-page-title]')
      if (titleHeading && pageData?.title) {
        titleHeading.textContent = `Edit "${pageData.title}"`
      }

      // Load questions from both page data and individual form entries
      const questions = this.loadQuestions(pageData)
      console.log('All questions loaded:', questions)

      // Display fields
      this.displayFields(questions)
    } catch (error) {
      console.error('Error loading page data:', error)
    }
  }

  PageEditor.prototype.loadQuestions = function(pageData) {
    const questions = [] // Use an array instead of Map
    
    // First, load questions from page data
    if (pageData && Array.isArray(pageData.questions)) {
      console.log('Loading questions from page data:', pageData.questions);
      pageData.questions.forEach(question => {
        if (question && question.id) {
          // Clean the ID and ensure it has form_ prefix
          const cleanId = 'form_' + question.id.replace(/^(form_)+/, '');
          // Initialize position if not set
          if (typeof question.position !== 'number') {
            question.position = questions.length;
          }
          questions.push({...question, id: cleanId, key: cleanId})
          console.log('Added question from page data:', question)
        }
      })
    }

    // Then load individual form entries, which might be more up to date
    const keys = Object.keys(localStorage)
    console.log('Scanning localStorage keys:', keys)

    // Sort questions by position
    questions.sort((a, b) => {
      const posA = typeof a.position === 'number' ? a.position : Infinity
      const posB = typeof b.position === 'number' ? b.position : Infinity
      return posA - posB
    })

    keys.forEach(key => {
      if (key.startsWith('form_') && key !== 'form_pages') {
        try {
          const question = JSON.parse(localStorage.getItem(key))
          console.log('Found question in localStorage:', { key, question })
          
          // Skip questions that don't belong to this page
          const questionPageId = question.pageId?.startsWith('page_') ? question.pageId : 'page_' + question.pageId
          if (questionPageId !== this.pageId) {
            return
          }

          // Update existing question or add new one
          const existingIndex = questions.findIndex(q => q.id === key)
          if (existingIndex >= 0) {
            questions[existingIndex] = { ...questions[existingIndex], ...question, id: key, key: key }
          } else {
            questions.push({ ...question, id: key, key: key, position: questions.length })
          }
          } catch (error) {
            console.error('Error parsing question data:', error)
          }
        }
      })

      // Sort questions by position
      questions.sort((a, b) => {
        const posA = typeof a.position === 'number' ? a.position : Infinity
        const posB = typeof b.position === 'number' ? b.position : Infinity
        if (posA !== posB) return posA - posB
        
        // Then by creation time if positions are equal
        const timeA = parseInt((a.id || '').split('_')[2]) || 0
        const timeB = parseInt((b.id || '').split('_')[2]) || 0
        return timeB - timeA
      })

      console.log('Final sorted questions:', questions)
      return questions
  }

  PageEditor.prototype.displayFields = function(questions) {
    console.log('Displaying fields:', questions)
    const tbody = document.querySelector('[data-questions-table] tbody')
    const previewPane = document.getElementById('page-preview')
    if (!tbody || !previewPane) {
      console.error('Required elements not found')
      return
    }

    // Ensure questions is an array and has field types
    questions = (Array.isArray(questions) ? questions : []).filter(q => q && q.fieldType)
    console.log('Filtered questions:', questions)

    // Clear both the table and preview
    tbody.innerHTML = ''
    previewPane.innerHTML = ''

    console.log('Raw questions:', questions)
    // Ensure we have an array and filter out invalid questions
    const questionArray = (Array.isArray(questions) ? questions : [])
      .filter(q => q && q.fieldType)
      .sort((a, b) => {
        const posA = typeof a.position === 'number' ? a.position : Infinity
        const posB = typeof b.position === 'number' ? b.position : Infinity
        return posA - posB
      })

    console.log('Final filtered and sorted questions:', questionArray)

    if (!questionArray || questionArray.length === 0) {
      console.log('No questions to display')
      tbody.innerHTML = `
        <tr class="govuk-table__row">
          <td class="govuk-table__cell" colspan="4" style="vertical-align: middle;">
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

    // Create preview container with heading
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

    // Add all questions to the preview container first
    questionArray.forEach(question => {
      const preview = this.generatePreview(question)
      if (preview) {
        previewContainer.appendChild(preview)
      }
    })

    // Add the preview container to the preview pane
    previewPane.innerHTML = ''
    previewPane.appendChild(previewContainer)

    // Now add the table rows
    questionArray.forEach(question => {
      console.log('Generating row for question:', question);
      
      // Format field type for display
      let fieldTypeDisplay = question.fieldType || 'Unknown';
      fieldTypeDisplay = fieldTypeDisplay.charAt(0).toUpperCase() + fieldTypeDisplay.slice(1);
      
      // Create edit URL with field type and clean ID
      const cleanId = question.id.replace(/^(form_)+/, 'form_');
      const editUrl = `/question-editor/${question.fieldType || 'radio'}/${cleanId}?pageId=${this.pageId}`;
      console.log('Edit URL will be:', editUrl);
      
      // Get the most up-to-date title from localStorage
      const questionData = JSON.parse(localStorage.getItem(cleanId) || '{}');
      const title = questionData.title || question.title || 'Untitled';
      
      const row = document.createElement('tr')
      row.className = 'govuk-table__row'
      row.setAttribute('data-question-id', cleanId)
      row.innerHTML = `
        <td class="govuk-table__cell" style="vertical-align: middle;">
          <a href="${editUrl}" class="govuk-link">${title}</a>
        </td>
        <td class="govuk-table__cell" style="vertical-align: middle;">${fieldTypeDisplay}</td>
        <td class="govuk-table__cell" style="vertical-align: middle;">
          <div class="govuk-button-group" style="margin-bottom: 0;">
            <button type="button" class="govuk-button govuk-button--secondary govuk-button--small" data-move-up>
              ↑<span class="govuk-visually-hidden">Move up</span>
            </button>
            <button type="button" class="govuk-button govuk-button--secondary govuk-button--small" data-move-down>
              ↓<span class="govuk-visually-hidden">Move down</span>
            </button>
          </div>
        </td>
        <td class="govuk-table__cell" style="vertical-align: middle; text-align: right;">
          <button type="button" class="govuk-button govuk-button--warning govuk-button--small govuk-!-margin-0" data-delete-field="${cleanId}">
            ×<span class="govuk-visually-hidden">Delete</span>
          </button>
        </td>
      `
      tbody.appendChild(row)

      // Add delete handler
      const deleteLink = row.querySelector('[data-delete-field]')
      if (deleteLink) {
        const pageEditor = this;
        deleteLink.addEventListener('click', (e) => {
          e.preventDefault()
          const fieldId = deleteLink.dataset.deleteField
          
          // Clean up any duplicate form_ prefixes
          const cleanId = 'form_' + fieldId.replace(/^(form_)+/, '')
          
          if (confirm('Are you sure you want to delete this field?')) {
            console.log('Deleting field:', { fieldId, cleanId })
            
            // Remove all variations of the ID from localStorage
            const variations = [
              cleanId,
              'form_' + cleanId,
              'form_form_' + cleanId.replace(/^form_/, ''),
              fieldId
            ];
            
            variations.forEach(id => {
              console.log('Attempting to remove:', id)
              localStorage.removeItem(id)
            });
            
            // Also remove from page data and update remaining questions
            const pageData = JSON.parse(localStorage.getItem(pageEditor.pageId) || '{}')
            if (pageData.questions) {
              // Remove the deleted question
              pageData.questions = pageData.questions.filter(q => {
                if (!q || !q.id) return false;
                const qId = 'form_' + q.id.replace(/^(form_)+/, '')
                return qId !== cleanId
              })
              
              // Update the remaining questions with latest data
              const updatedQuestions = []
              pageData.questions.forEach(q => {
                const questionId = 'form_' + q.id.replace(/^(form_)+/, '')
                try {
                  const questionData = JSON.parse(localStorage.getItem(questionId))
                  if (questionData) {
                    updatedQuestions.push({
                      id: q.id.replace(/^(form_)+/, ''),
                      pageId: pageEditor.pageId,
                      fieldType: questionData.fieldType,
                      title: questionData.title,
                      hint: questionData.hint,
                      options: questionData.options || []
                    })
                  }
                } catch (error) {
                  console.error('Error processing question:', error)
                }
              })
              
              pageData.questions = updatedQuestions
              localStorage.setItem(pageEditor.pageId, JSON.stringify(pageData))
            }
            
            pageEditor.loadPageData() // Reload the page data
          }
        })
      }
    })
  }

  PageEditor.prototype.generatePreview = function(question) {
    console.log('Generating preview for question:', question)
    if (!question || !question.fieldType || !QuestionTemplates[question.fieldType]) {
      console.log('Invalid question data or unsupported field type:', question)
      return null
    }

    // Get the latest data from localStorage
    try {
      const latestData = JSON.parse(localStorage.getItem(question.id))
      if (latestData) {
        question = { ...question, ...latestData }
      }
    } catch (error) {
      console.error('Error getting latest question data:', error)
    }

    const title = question.title || 'Question text'
    const hint = question.hint || ''

    // Create container and set HTML from template
    const fieldContainer = document.createElement('div')
    fieldContainer.innerHTML = QuestionTemplates[question.fieldType](question, title, hint)

    // Return the first child (the actual field container)
    return fieldContainer.firstElementChild

  }

  PageEditor.prototype.setupEventListeners = function() {
    // Set up table event handlers
    const tbody = document.querySelector('[data-questions-table] tbody')
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const deleteLink = e.target.closest('[data-delete-field]')
        const moveUpBtn = e.target.closest('[data-move-up]')
        const moveDownBtn = e.target.closest('[data-move-down]')

        if (deleteLink) {
          e.preventDefault()
          const fieldId = deleteLink.dataset.deleteField
          if (confirm('Are you sure you want to delete this field?')) {
            localStorage.removeItem(fieldId)
            this.loadPageData()
          }
        } else if (moveUpBtn || moveDownBtn) {
          e.preventDefault()
          const row = e.target.closest('tr')
          const questionId = row.dataset.questionId
          const direction = moveUpBtn ? -1 : 1
          this.moveQuestion(questionId, direction)
        }
      })
    }

    // Add field button
    const addFieldButton = document.querySelector('[data-add-field]')
    if (addFieldButton) {
      addFieldButton.addEventListener('click', () => {
        window.location.href = `/field-types?pageId=${this.pageId}`
      })
    }

    // Save button - now just redirects since we auto-save
    const saveButton = document.querySelector('[data-save]')
    if (saveButton) {
      saveButton.addEventListener('click', (e) => {
        e.preventDefault()
        window.location.href = '/pages'
      })
    }

    // Back to pages button
    const backButton = document.querySelector('[href="/pages"]')
    if (backButton) {
      backButton.addEventListener('click', (e) => {
        // No need to confirm since everything is already saved
        // Just let the navigation happen
      })
    }
  }

  PageEditor.prototype.savePage = function() {
    try {
      // Get current page data
      const pageData = JSON.parse(localStorage.getItem(this.pageId) || '{}')
      if (!pageData) return;
      
      // Get all questions for this page from localStorage
      const questions = []
      const keys = Object.keys(localStorage)
      
      keys.forEach(key => {
        if (key.startsWith('form_')) {
          try {
            const questionData = JSON.parse(localStorage.getItem(key))
            if (questionData && questionData.pageId === this.pageId) {
              // Clean up the question data
              questions.push({
                id: key.replace(/^(form_)+/, ''),
                pageId: this.pageId,
                fieldType: questionData.fieldType,
                title: questionData.title,
                hint: questionData.hint,
                options: questionData.options || [],
                position: typeof questionData.position === 'number' ? questionData.position : questions.length
              })
            }
          } catch (error) {
            console.error('Error processing question:', error)
          }
        }
      })
      
      // Update page data with questions
      pageData.questions = questions
      console.log('Saving page with questions:', pageData)
      localStorage.setItem(this.pageId, JSON.stringify(pageData))
      window.location.href = '/pages'
    } catch (error) {
      console.error('Error saving page:', error)
    }
  }

  // Debug function to check localStorage
  function debugLocalStorage() {
    console.log('Checking localStorage contents:')
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('form_')) {
        try {
          const value = JSON.parse(localStorage.getItem(key))
          console.log('Key:', key, 'Value:', value)
        } catch (error) {
          console.log('Key:', key, 'Error parsing:', error)
        }
      }
    }
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    debugLocalStorage()
    const pageEditor = document.querySelector('[data-module="page-editor"]')
    if (pageEditor) {
      const editor = new PageEditor(pageEditor)
      editor.init()
    }
  })

})(window.GOVUKPrototype);
