;(function(Prototype) {
  function PageCreate() {
    // Handle form submission
    const form = document.querySelector('form')
    if (form) {
      form.addEventListener('submit', function(e) {
        const titleInput = document.querySelector('#page-title')
        if (titleInput && titleInput.value) {
          // Store the title temporarily so we can access it after redirect
          sessionStorage.setItem('pending_page_title', titleInput.value.trim())
        }
      })
    }
    
    // Try to get page data from URL
    const urlParams = new URLSearchParams(window.location.search)
    const rawPageId = window.location.pathname.split('/').pop()
    const pageTitle = urlParams.get('title') || sessionStorage.getItem('pending_page_title')
    
    // Clear temporary storage
    sessionStorage.removeItem('pending_page_title')
    
    // Ensure page ID has correct prefix
    const pageId = rawPageId.startsWith('page_') ? rawPageId : 'page_' + rawPageId
    
    if (pageId && pageTitle) {
      console.log('Creating new page:', { pageId, pageTitle })
      
      // Save new page data
      const pageData = {
        id: pageId,
        title: pageTitle,
        questions: []
      }
      
      // Save the page data
      localStorage.setItem(pageId, JSON.stringify(pageData))
      console.log('Page created:', pageData)
      
      // Also update any existing questions to reference this page
      const keys = Object.keys(localStorage)
      const updatedQuestions = []
      
      keys.forEach(key => {
        if (key.startsWith('form_')) {
          try {
            const questionData = JSON.parse(localStorage.getItem(key))
            if (questionData && questionData.pageId === rawPageId) {
              // Update question's pageId
              questionData.pageId = pageId
              localStorage.setItem(key, JSON.stringify(questionData))
              
              // Add to page's questions array
              updatedQuestions.push({
                id: key.replace(/^form_/, ''),
                pageId: pageId,
                fieldType: questionData.fieldType,
                title: questionData.title,
                hint: questionData.hint,
                options: questionData.options || []
              })
            }
          } catch (error) {
            console.error('Error updating question:', error)
          }
        }
      })
      
      // Update page data with questions
      if (updatedQuestions.length > 0) {
        pageData.questions = updatedQuestions
        localStorage.setItem(pageId, JSON.stringify(pageData))
        console.log('Updated page with questions:', pageData)
      }
    }
  }

  // Initialize immediately
  new PageCreate()
})(window.GOVUKPrototype = window.GOVUKPrototype || {})
