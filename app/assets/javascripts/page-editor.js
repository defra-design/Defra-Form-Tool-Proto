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

  PageEditor.prototype.init = function() {
    if (!this.$module) {
      console.error('Missing module')
      return
    }

    if (!this.pageId) {
      console.error('Invalid or missing pageId:', this.pageId)
      return
    }

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
    const questions = new Map() // Use a Map to deduplicate by ID
    
    // First, load questions from page data
    if (pageData && Array.isArray(pageData.questions)) {
      console.log('Loading questions from page data:', pageData.questions);
      pageData.questions.forEach(question => {
        if (question && question.id) {
          // Clean the ID and ensure it has form_ prefix
          const cleanId = 'form_' + question.id.replace(/^(form_)+/, '');
          // Ensure question has all required fields
          if (!question.fieldType) {
            console.warn('Question missing field type:', question);
          }
          questions.set(cleanId, {...question, id: cleanId})
          console.log('Added question from page data:', question)
        }
      })
    }

    // Then load individual form entries, which might be more up to date
    const keys = Object.keys(localStorage)
    console.log('Scanning localStorage keys:', keys)

    keys.forEach(key => {
      if (key.startsWith('form_')) {
        try {
          const question = JSON.parse(localStorage.getItem(key))
          console.log('Found question in localStorage:', { key, question })
          
          // Normalize the pageId to handle both prefixed and unprefixed versions
          const questionPageId = question.pageId?.startsWith('page_') ? question.pageId : 'page_' + question.pageId
          if (question && questionPageId === this.pageId) {
            // Clean the ID and ensure it has form_ prefix
            const cleanId = 'form_' + key.replace(/^(form_)+/, '')
            
            // Update or add the question
            const existingQuestion = questions.get(cleanId)
            if (existingQuestion) {
              // Merge with existing data, preferring localStorage values
              questions.set(cleanId, {
                ...existingQuestion,
                ...question,
                id: cleanId
              })
              console.log('Updated existing question:', questions.get(cleanId))
            } else {
              questions.set(cleanId, {...question, id: cleanId})
              console.log('Added new question:', questions.get(cleanId))
            }
          }
        } catch (error) {
          console.error('Error parsing question data:', error)
        }
      }
    })

    // Convert to array and sort by creation time (newest first)
    const sortedQuestions = Array.from(questions.values())
      .sort((a, b) => {
        const timeA = parseInt((a.id || '').split('_')[2]) || 0
        const timeB = parseInt((b.id || '').split('_')[2]) || 0
        return timeB - timeA // Sort newest first
      })

    console.log('Final sorted questions:', sortedQuestions)
    return sortedQuestions
  }

  PageEditor.prototype.displayFields = function(questions) {
    console.log('Displaying fields:', questions)
    const tbody = document.querySelector('[data-questions-table] tbody')
    if (!tbody) {
      console.error('No tbody found')
      return
    }

    // Convert Map to array if needed
    const questionArray = questions instanceof Map ? Array.from(questions.values()) : questions;

    if (!questionArray || questionArray.length === 0) {
      console.log('No questions to display')
      tbody.innerHTML = `
        <tr class="govuk-table__row">
          <td class="govuk-table__cell" colspan="4">
            <p class="govuk-body">No fields added yet. Choose a field type above to add your first field.</p>
          </td>
        </tr>
      `
      return
    }

    tbody.innerHTML = ''
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
      row.innerHTML = `
        <td class="govuk-table__cell">${title}</td>
        <td class="govuk-table__cell">${fieldTypeDisplay}</td>
        <td class="govuk-table__cell">
          <a href="${editUrl}" class="govuk-link govuk-!-margin-right-2">
            Edit<span class="govuk-visually-hidden"> ${title}</span>
          </a>
          <a href="#" class="govuk-link govuk-link--danger" data-delete-field="${cleanId}">
            Delete<span class="govuk-visually-hidden"> ${title}</span>
          </a>
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

  PageEditor.prototype.setupEventListeners = function() {
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
                options: questionData.options || []
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

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const pageEditor = document.querySelector('[data-module="page-editor"]')
    if (pageEditor) {
      const editor = new PageEditor(pageEditor)
      editor.init()
    }
  })

})(window.GOVUKPrototype);
