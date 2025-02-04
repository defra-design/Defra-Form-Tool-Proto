;(function(Prototype) {
  function Pages($module) {
    this.$module = $module
    this.$pagesList = document.querySelector('[data-pages-list]')
  }

  Pages.prototype.init = function() {
    if (!this.$module) return

    // Handle page creation from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const pageId = window.location.pathname.split('/').pop()
    const pageTitle = urlParams.get('title')
    
    if (pageId && pageTitle && window.location.pathname.includes('/page-editor/')) {
      // Save new page data
      const pageData = {
        id: pageId,
        title: pageTitle,
        questions: []
      }
      localStorage.setItem(pageId, JSON.stringify(pageData))
    }

    // Load pages
    this.loadPages()
  }

  Pages.prototype.loadPages = function() {
    if (!this.$pagesList) return

    const pages = []
    const keys = Object.keys(localStorage)
    console.log('Loading pages from localStorage keys:', keys)

    // Get all pages
    keys.forEach(key => {
      if (key.startsWith('page_')) {
        try {
          console.log('Found page key:', key)
          const pageData = localStorage.getItem(key)
          console.log('Raw page data:', pageData)
          
          const page = JSON.parse(pageData)
          console.log('Parsed page:', page)
          
          // Add page if it has an ID, even if missing title
          if (page && page.id) {
            // Ensure page has a title
            if (!page.title) {
              page.title = 'Untitled Page'
            }
            pages.push(page)
          }
        } catch (error) {
          console.error('Error loading page:', key, error)
          // Try to recover corrupted data
          try {
            const rawData = localStorage.getItem(key)
            if (rawData) {
              const fixedData = rawData.replace(/\n/g, '').trim()
              const page = JSON.parse(fixedData)
              if (page && page.id) {
                page.title = page.title || 'Untitled Page'
                pages.push(page)
                // Save fixed data back
                localStorage.setItem(key, JSON.stringify(page))
              }
            }
          } catch (recoveryError) {
            console.error('Could not recover page data:', key, recoveryError)
          }
        }
      }
    })

    // Sort pages by creation time
    pages.sort((a, b) => {
      const timeA = parseInt((a.id || '').split('_')[1]) || 0
      const timeB = parseInt((b.id || '').split('_')[1]) || 0
      return timeB - timeA // Newest first
    })

    // Display pages
    if (pages.length === 0) {
      this.$pagesList.innerHTML = `
        <p class="govuk-body">No pages added yet. Click 'Add a page' to create your first page.</p>
      `
      return
    }

    this.$pagesList.innerHTML = `
      <table class="govuk-table">
        <thead class="govuk-table__head">
          <tr class="govuk-table__row">
            <th class="govuk-table__header">Page title</th>
            <th class="govuk-table__header" colspan="2"><span class="govuk-visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody class="govuk-table__body">
          ${pages.map(page => `
            <tr class="govuk-table__row" data-page-id="${page.id}">
              <td class="govuk-table__cell">${page.title}</td>
              <td class="govuk-table__cell">
                <a href="/page-editor/${page.id}" class="govuk-link govuk-!-margin-right-2">Edit<span class="govuk-visually-hidden"> ${page.title}</span></a>
                <a href="#" class="govuk-link govuk-link--danger" data-delete-page>Delete<span class="govuk-visually-hidden"> ${page.title}</span></a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    // Add delete handlers
    const deleteLinks = this.$pagesList.querySelectorAll('[data-delete-page]')
    deleteLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const row = link.closest('[data-page-id]')
        const pageId = row.getAttribute('data-page-id')
        const page = pages.find(p => p.id === pageId)
        
        if (confirm(`Are you sure you want to delete "${page.title}"?`)) {
          localStorage.removeItem(pageId)
          this.loadPages()
        }
      })
    })
  }

  // Expose Pages class to GOVUKPrototype namespace
  Prototype.Pages = Pages
})(window.GOVUKPrototype = window.GOVUKPrototype || {})
