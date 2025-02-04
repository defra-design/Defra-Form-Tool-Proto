//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototype = window.GOVUKPrototype || {}

window.GOVUKPrototype.initAll = function () {
  // Initialize form preview
  const $formPreview = document.querySelector('[data-form-preview]')
  if ($formPreview) {
    console.log('Initializing form preview')
    new window.GOVUKPrototype.FormPreview($formPreview).init()
  }

  // Initialize pages
  const $pages = document.querySelector('[data-pages]')
  if ($pages) {
    console.log('Initializing pages')
    new window.GOVUKPrototype.Pages($pages).init()
  }

  // Initialize questions list
  const $questionsList = document.querySelector('[data-questions-list]')
  if ($questionsList) {
    console.log('Initializing questions list')
    new window.GOVUKPrototype.QuestionsList($questionsList).init()
  }

  // Initialize page editor
  const $pageEditor = document.querySelector('[data-page-editor]')
  if ($pageEditor) {
    console.log('Initializing page editor')
    new window.GOVUKPrototype.PageEditor()
  }
}

// Initialize all components when the DOM is ready
window.GOVUKPrototypeKit.documentReady(() => {
  window.GOVUKPrototype.initAll()
})

// Pages
function Pages($module) {
  this.$module = $module
  this.$pagesList = document.querySelector('[data-pages-list]')
  this.$addButton = document.querySelector('[data-add-page]')
}

Pages.prototype.init = function() {
  if (!this.$module) return

  // Add page button handler
  if (this.$addButton) {
    this.$addButton.addEventListener('click', () => {
      const id = 'page_' + Date.now()
      const page = {
        id: id,
        title: 'New page'
      }
      localStorage.setItem(id, JSON.stringify(page))
      this.loadPages()
    })
  }

  // Load pages
  this.loadPages()
}

Pages.prototype.loadPages = function() {
  if (!this.$pagesList) return

  const pages = []
  const keys = Object.keys(localStorage)

  // Get all pages
  keys.forEach(key => {
    if (key.startsWith('page_')) {
      try {
        const page = JSON.parse(localStorage.getItem(key))
        if (page && page.id && page.title) {
          pages.push(page)
        }
      } catch (error) {
        console.error('Error loading page:', error)
      }
    }
  })

  // Sort pages by creation time
  pages.sort((a, b) => {
    const timeA = parseInt((a.id || '').split('_')[1]) || 0
    const timeB = parseInt((b.id || '').split('_')[1]) || 0
    return timeA - timeB
  })

  // Display pages
  if (pages.length === 0) {
    this.$pagesList.innerHTML = `
      <div class="govuk-inset-text">
        No pages yet. Click 'Add a page' to create your first page.
      </div>
    `
  } else {
    this.$pagesList.innerHTML = `
      <ul class="govuk-list">
        ${pages.map((page, index) => `
          <li class="govuk-!-margin-bottom-4">
            <div class="govuk-grid-row">
              <div class="govuk-grid-column-one-half">
                <h2 class="govuk-heading-m govuk-!-margin-bottom-1">
                  ${page.title}
                </h2>
                <p class="govuk-body govuk-!-margin-bottom-2">
                  Page ${index + 1}
                </p>
              </div>
              <div class="govuk-grid-column-one-half">
                <div class="govuk-button-group">
                  <a href="/questions?pageId=${page.id}" role="button" draggable="false" 
                     class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" 
                     data-module="govuk-button">
                    Edit fields
                  </a>
                  <button class="govuk-button govuk-button--warning govuk-!-margin-bottom-0" 
                          data-delete-page="${page.id}">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </li>
        `).join('')}
      </ul>
    `

    // Add delete handlers
    const deleteButtons = this.$pagesList.querySelectorAll('[data-delete-page]')
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const pageId = button.dataset.deletePage
        if (confirm('Are you sure you want to delete this page?')) {
          localStorage.removeItem(pageId)
          // Also delete any fields associated with this page
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('form_')) {
              try {
                const field = JSON.parse(localStorage.getItem(key))
                if (field && field.pageId === pageId) {
                  localStorage.removeItem(key)
                }
              } catch (error) {
                console.error('Error checking field:', error)
              }
            }
          })
          this.loadPages()
        }
      })
    })
  }
}

const $pagesContainer = document.querySelector('[data-pages]')
if ($pagesContainer) {
  console.log('Found pages container')
  const pages = new Pages($pagesContainer)
  pages.init()
} else {
  console.log('No pages container found')
}
