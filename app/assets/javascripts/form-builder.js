// app/assets/javascripts/form-builder.js

window.GOVUKPrototype = window.GOVUKPrototype || {}

;(function(Prototype) {
  function FormBuilder($module) {
	if (!$module) return
	this.$module = $module
	this.$editor = $module.querySelector('[data-editor]')
	this.$preview = $module.querySelector('[data-preview]')
	this.formId = this.$module.dataset.formId || null
	this.autosaveTimeout = null
  }

  FormBuilder.prototype.init = function() {
	if (!this.$module || !this.$editor || !this.$preview) {
	  console.warn('Form builder missing required elements')
	  return
	}

	// Load saved form if ID exists
	if (this.formId) {
	  this.loadSavedForm()
	}

	// Set up event listeners for form submit
	this.$editor.addEventListener('submit', (event) => {
	  // Save to localStorage before form submission
	  this.saveToStorage()
	})

	// Set up event listeners for preview updates
	this.$editor.addEventListener('input', (event) => {
	  if (event.target.matches('[data-preview-update]')) {
		// Update preview immediately
		this.updatePreview()
		
		// Debounced storage save
		clearTimeout(this.autosaveTimeout)
		this.autosaveTimeout = setTimeout(() => {
		  this.saveToStorage()
		}, 500)
	  }
	})

	// Handle option reordering
	this.$module.addEventListener('click', (event) => {
	  const moveButton = event.target.closest('[data-move]')
	  if (!moveButton) return

	  const optionRow = moveButton.closest('[data-option-id]')
	  if (!optionRow) return

	  const direction = moveButton.dataset.move
	  const optionId = optionRow.dataset.optionId

	  // Get current data from localStorage
	  const savedData = JSON.parse(localStorage.getItem(`form_${this.formId}`))
	  if (!savedData || !savedData.options) return

	  // Find current index of the option
	  const currentIndex = savedData.options.findIndex(opt => opt.id === optionId)
	  if (currentIndex === -1) return

	  // Calculate new index
	  const newIndex = direction === 'up' 
		? Math.max(0, currentIndex - 1)
		: Math.min(savedData.options.length - 1, currentIndex + 1)

	  if (currentIndex !== newIndex) {
		// Swap the options in the array
		const temp = savedData.options[currentIndex]
		savedData.options[currentIndex] = savedData.options[newIndex]
		savedData.options[newIndex] = temp

		// Save updated order to localStorage
		localStorage.setItem(`form_${this.formId}`, JSON.stringify(savedData))

		// Update the table display
		const tbody = optionRow.closest('.govuk-table__body')
		if (tbody) {
		  const rows = savedData.options.map(option => `
			<tr class="govuk-table__row" data-option-id="${option.id}">
			  <td class="govuk-table__cell" style="width: 50%">${option.text}</td>
			  <td class="govuk-table__cell">
				<div class="app-option-order">
				  ${option !== savedData.options[0] ? `
					<button type="button" class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" 
							data-move="up" aria-label="Move ${option.text} up">
					  ↑<span class="govuk-visually-hidden"> Move up</span>
					</button>
				  ` : ''}
				  ${option !== savedData.options[savedData.options.length - 1] ? `
					<button type="button" class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" 
							data-move="down" aria-label="Move ${option.text} down">
					  ↓<span class="govuk-visually-hidden"> Move down</span>
					</button>
				  ` : ''}
				</div>
			  </td>
			  <td class="govuk-table__cell">
				<a href="/question/${this.formId}/${savedData.fieldType}/option/${option.id}/edit" 
				   class="govuk-link govuk-!-margin-right-2">Edit<span class="govuk-visually-hidden"> ${option.text}</span></a>
				<a href="#" 
				   class="govuk-link govuk-link--danger" 
				   data-delete-option 
				   data-option-id="${option.id}">Delete<span class="govuk-visually-hidden"> ${option.text}</span></a>
			  </td>
			</tr>
		  `).join('')
		  tbody.innerHTML = rows
		}

		// Update preview
		this.updatePreview()
	  }
	})

	// Handle option deletion
	this.$module.addEventListener('click', (event) => {
	  const deleteButton = event.target.closest('[data-delete-option]')
	  if (!deleteButton) return

	  event.preventDefault()

	  if (confirm('Are you sure you want to delete this option?')) {
		const optionId = deleteButton.dataset.optionId
		const savedData = JSON.parse(localStorage.getItem(`form_${this.formId}`))
		
		if (savedData && savedData.options) {
		  savedData.options = savedData.options.filter(opt => opt.id !== optionId)
		  localStorage.setItem(`form_${this.formId}`, JSON.stringify(savedData))
		  
		  // Update preview
		  this.updatePreview()
		  
		  // Remove the table row
		  const tr = deleteButton.closest('tr')
		  if (tr) tr.remove()
		}
	  }
	})

	// Initial preview render
	this.updatePreview()
  }

  FormBuilder.prototype.loadSavedForm = function() {
	const savedForm = localStorage.getItem(`form_${this.formId}`)
	if (savedForm) {
	  const formData = JSON.parse(savedForm)
	  // Load normal form fields
	  Object.entries(formData).forEach(([key, value]) => {
		const field = this.$editor.querySelector(`[name="${key}"]`)
		if (field) {
		  field.value = value
		}
	  })

	  // Load options list if we have options
	  if (formData.options && formData.options.length > 0) {
		const tbody = this.$editor.querySelector('.govuk-table__body')
		if (tbody) {
		  const rows = formData.options.map(option => `
			<tr class="govuk-table__row" data-option-id="${option.id}">
			  <td class="govuk-table__cell">${option.text}</td>
			  <td class="govuk-table__cell">
				<div class="app-option-order">
				  <button type="button" class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" 
						  data-move="up" aria-label="Move ${option.text} up">
					↑<span class="govuk-visually-hidden"> Move up</span>
				  </button>
				  <button type="button" class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" 
						  data-move="down" aria-label="Move ${option.text} down">
					↓<span class="govuk-visually-hidden"> Move down</span>
				  </button>
				</div>
			  </td>
			  <td class="govuk-table__cell">
				<a href="/question/${this.formId}/${formData.fieldType}/option/${option.id}/edit" 
				   class="govuk-link govuk-!-margin-right-2">Edit<span class="govuk-visually-hidden"> ${option.text}</span></a>
				<a href="#" 
				   class="govuk-link govuk-link--danger" 
				   data-delete-option 
				   data-option-id="${option.id}">Delete<span class="govuk-visually-hidden"> ${option.text}</span></a>
			  </td>
			</tr>
		  `).join('')
		  tbody.innerHTML = rows

		  // Hide any "No options" message
		  const noOptionsMsg = this.$editor.querySelector('.govuk-body')
		  if (noOptionsMsg && noOptionsMsg.textContent.includes('No options')) {
			noOptionsMsg.style.display = 'none'
		  }
		}
	  }
	}
  }

  FormBuilder.prototype.saveToStorage = function() {
	const formData = new FormData(this.$editor)
	const data = Object.fromEntries(formData.entries())
	
	// Ensure we have an ID
	const formId = data.id || this.formId || `question_${Date.now()}`
	data.id = formId

	// Get any existing data to preserve options
	const existingData = this.formId ? JSON.parse(localStorage.getItem(`form_${this.formId}`)) || {} : {}
	
	// Merge existing options with current data
	data.options = existingData.options || []

	// Save to localStorage
	localStorage.setItem(`form_${formId}`, JSON.stringify(data))
	
	// Update formId if it was newly generated
	if (!this.formId) {
	  this.formId = formId
	  this.$module.dataset.formId = formId
	}
  }

  FormBuilder.prototype.updatePreview = function() {
	if (!this.$editor || !this.$preview) return

	const formData = new FormData(this.$editor)
	const data = Object.fromEntries(formData.entries())

	// Get any existing options from localStorage
	if (this.formId) {
	  const savedData = JSON.parse(localStorage.getItem(`form_${this.formId}`)) || {}
	  data.options = savedData.options || []
	}
	
	fetch('/preview', {
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json'
	  },
	  body: JSON.stringify(data)
	})
	  .then(response => response.text())
	  .then(html => {
		this.$preview.innerHTML = html
	  })
	  .catch(error => console.error('Error updating preview:', error))
  }

  Prototype.FormBuilder = FormBuilder
})(window.GOVUKPrototype)