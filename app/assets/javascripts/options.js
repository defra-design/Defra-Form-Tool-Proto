// Options management for GOV.UK Prototype Kit
window.Prototype = window.Prototype || {};

class OptionManager {
  constructor(container) {
    if (!container) throw new Error('Container element is required');
    this.container = container;
    this.$optionsList = container;
    this.questionId = null;
    this.pageId = null;
    this.fieldType = null;
    this.previewContainer = null;
  }

  init() {
    // Initialize lists dropdown
    this.initializeLists();
    
    // Load any saved options
    this.loadSavedOptions();

    // Set up import button handler
    const importButton = this.container.querySelector('[data-import-list]');
    if (importButton) {
      importButton.addEventListener('click', () => this.importListOptions());
    }
  }

  getQuestionData() {
    try {
      const data = localStorage.getItem(this.questionId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing question data:', error);
      return null;
    }
  };

  safeUpdateStorage(newData) {
    if (!this.questionId) {
      console.error('Cannot update storage: questionId not set');
      return false;
    }

    try {
      // Get existing data
      const existingData = this.getQuestionData();
      
      // Safety check: Don't allow clearing existing data without confirmation
      if (existingData && (!newData || !newData.options)) {
        console.error('Attempted to clear existing data without confirmation');
        return false;
      }

      // Safety check: Preserve existing data if new data is missing fields
      if (existingData && newData) {
        newData.id = newData.id || existingData.id;
        newData.pageId = newData.pageId || existingData.pageId;
        newData.fieldType = newData.fieldType || existingData.fieldType;
        newData.title = newData.title || existingData.title;
        newData.hint = newData.hint || existingData.hint;
        newData.options = newData.options || existingData.options;
      }

      // Validate data structure
      if (!this.validateQuestionData(newData)) {
        console.error('Invalid data structure:', newData);
        return false;
      }

      // Save to localStorage
      localStorage.setItem(this.questionId, JSON.stringify(newData));
      return true;
    } catch (error) {
      console.error('Error updating storage:', error);
      return false;
    }
  };

  validateQuestionData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Required fields
    if (!data.id || !data.pageId || !data.fieldType) return false;
    
    // Options must be an array if present
    if (data.options && !Array.isArray(data.options)) return false;
    
    // Each option must have id and text
    if (data.options) {
      return data.options.every(option => 
        option && 
        typeof option === 'object' && 
        option.id && 
        typeof option.text === 'string'
      );
    }
    
    return true;
  };

  save() {
    const questionData = this.getQuestionData() || {
      id: this.questionId,
      pageId: this.pageId,
      fieldType: this.fieldType,
      title: '',
      hint: '',
      options: []
    };

    // Get current title and hint
    const titleInput = document.querySelector('[data-question-title]');
    const hintInput = document.querySelector('[data-question-hint]');
    if (titleInput) questionData.title = titleInput.value;
    if (hintInput) questionData.hint = hintInput.value;

    // Get current options from the table
    const tbody = this.container.querySelector('tbody');
    if (tbody) {
      questionData.options = Array.from(tbody.querySelectorAll('tr')).map(row => ({
        id: row.getAttribute('data-option-id'),
        text: row.querySelector('.govuk-body').textContent.trim(),
        hint: row.querySelector('.govuk-hint')?.textContent.trim() || '',
        value: row.querySelector('.govuk-hint')?.textContent.trim().replace(/^Value: /, '') || ''
      }));
    }

    // Safely update storage
    if (this.safeUpdateStorage(questionData)) {
      this.updatePreview();
      return questionData;
    }
    return null;
  };

  renderFromStorage() {
    const questionData = this.getQuestionData();
    if (!questionData || !questionData.options) {
      console.log('No options to render');
      return;
    }

    // Clear existing options first
    const tbody = this.container.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
    }

    // Render each option
    questionData.options.forEach((option, index) => {
      this.renderOption(option, index, questionData.options.length);
    });

    // Update preview
    this.updatePreview();
  };

  renderOption(option, index, total) {
    if (!option || !option.text) return;

    const row = document.createElement('tr');
    row.setAttribute('data-option-id', option.id);
    row.classList.add('govuk-table__row');
    
    row.innerHTML = `
      <td class="govuk-table__cell">
        <p class="govuk-body">${option.text}</p>
      </td>
      <td class="govuk-table__cell govuk-table__cell--numeric" style="white-space: nowrap;">
        <div class="govuk-button-group">
          <button class="govuk-button govuk-button--secondary govuk-!-margin-right-1" 
                  data-move-up 
                  ${index === 0 ? 'disabled' : ''}>
            ↑<span class="govuk-visually-hidden">Move up</span>
          </button>
          <button class="govuk-button govuk-button--secondary govuk-!-margin-right-1" 
                  data-move-down
                  ${index === total - 1 ? 'disabled' : ''}>
            ↓<span class="govuk-visually-hidden">Move down</span>
          </button>
          <a href="/option-editor/${this.fieldType}/${option.id}?questionId=${this.questionId}&pageId=${this.pageId}&returnUrl=/question-editor/${this.fieldType}/${this.questionId}%3FpageId=${this.pageId}" 
             class="govuk-button govuk-button--secondary govuk-!-margin-right-1"
             role="button">
            Edit<span class="govuk-visually-hidden"> ${option.text}</span>
          </a>
          <button class="govuk-button govuk-button--warning" 
                  data-delete-option>
            ×<span class="govuk-visually-hidden">Delete ${option.text}</span>
          </button>
        </div>
      </td>
    `;

    // Add event listeners
    const moveUpBtn = row.querySelector('[data-move-up]');
    const moveDownBtn = row.querySelector('[data-move-down]');
    const deleteBtn = row.querySelector('[data-delete-option]');

    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', () => this.moveOption(option.id, 'up'));
    }
    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', () => this.moveOption(option.id, 'down'));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteOption(option.id));
    }

    return row;
  };

  render() {
    const tbody = this.container.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Get options from storage
    const questionData = this.getQuestionData();
    if (!questionData || !questionData.options) return;

    const options = questionData.options;

    // Show empty state if no options
    if (options.length === 0) {
      tbody.innerHTML = `
        <tr class="govuk-table__row">
          <td class="govuk-table__cell" colspan="2">
            <p class="govuk-body govuk-!-margin-bottom-0">No options added yet</p>
          </td>
        </tr>
      `;
      return;
    }

    // Render each option
    options.forEach((option, index) => {
      const row = this.renderOption(option, index, options.length);
      if (row) {
        tbody.appendChild(row);
      }
    });

    // Update preview
    this.updatePreview();
  };

  initializeLists() {
    const select = this.container.querySelector('#import-list');
    if (!select) {
      console.error('Import list select not found');
      return;
    }

    // Clear existing options except the first one
    while (select.options.length > 1) {
      select.remove(1);
    }

    fetch('/api/lists')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(listsData => {
        if (!listsData || typeof listsData !== 'object') {
          throw new Error('Expected object of lists but got: ' + typeof listsData);
        }
        
        // Store lists data for later use
        this.listsData = listsData;
        
        // Add lists to dropdown
        Object.entries(listsData).forEach(([id, list]) => {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = list.name;
          select.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error loading lists:', error);
      });

    // Handle list import
    const importButton = this.container.querySelector('[data-import-list]');
    if (importButton) {
      importButton.addEventListener('click', () => {
        const listId = select.value;
        if (!listId || !this.listsData || !this.listsData[listId]) {
          console.error('No list selected or list data not found');
          return;
        }

        const selectedList = this.listsData[listId];
        console.log('Importing list:', selectedList);

        // Get current data to preserve title and hint
        const questionData = this.getQuestionData() || {
          id: this.questionId,
          pageId: this.pageId,
          fieldType: this.fieldType,
          title: '',
          hint: '',
          options: []
        };

        // Create new data object with only unique options
        const newData = { ...questionData };
        const seenTexts = new Set();
        
        if (selectedList.options && Array.isArray(selectedList.options)) {
          newData.options = selectedList.options
            .filter(option => {
              const text = (option.text || option).trim();
              if (!text || seenTexts.has(text.toLowerCase())) return false;
              seenTexts.add(text.toLowerCase());
              return true;
            })
            .map(option => ({
              id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              text: (option.text || option).trim(),
              hint: option.hint || '',
              value: option.value || ''
            }));

          // Safely update storage and render
          if (this.safeUpdateStorage(newData)) {
            // Clear existing options and render new ones
            const tbody = this.container.querySelector('tbody');
            if (tbody) tbody.innerHTML = '';
            this.renderFromStorage();
          }
        }

        // Clear the select
        select.value = '';
      });
    }
  };

  setupEventListeners() {
    if (!this.container) return;

    // Handle option reordering and deletion using event delegation
    const tbody = this.container.querySelector('tbody');
    if (!tbody) {
      console.error('Table body not found');
      return;
    }

    // Remove any existing click handlers
    tbody.removeEventListener('click', this.handleClick);
    tbody.addEventListener('click', this.handleClick);

    // Handle title and hint changes
    const titleInput = document.querySelector('[data-question-title]');
    const hintInput = document.querySelector('[data-question-hint]');

    if (titleInput) {
      titleInput.addEventListener('input', () => {
        this.save();
      });
    }

    if (hintInput) {
      hintInput.addEventListener('input', () => {
        this.save();
      });
    }

    // Handle new option input
    const newOptionInput = this.container.querySelector('#new-option');
    const addOptionButton = this.container.querySelector('[data-add-option]');
    
    if (newOptionInput && addOptionButton) {
      const addNewOption = () => {
        const text = newOptionInput.value.trim();
        if (text) {
          this.addOption({
            id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: text
          });
          newOptionInput.value = '';
        }
      };

      addOptionButton.addEventListener('click', addNewOption);
      newOptionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addNewOption();
        }
      });
    }
  };

  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const button = e.target.closest('button');
    if (!button) return;

    const row = button.closest('tr');
    if (!row) return;

    if (button.matches('[data-move-up]') && !button.disabled) {
      const prevRow = row.previousElementSibling;
      if (prevRow) {
        row.parentNode.insertBefore(row, prevRow);
        this.save();
        this.updateButtonStates();
      }
    } else if (button.matches('[data-move-down]') && !button.disabled) {
      const nextRow = row.nextElementSibling;
      if (nextRow) {
        row.parentNode.insertBefore(nextRow, row);
        this.save();
        this.updateButtonStates();
      }
    } else if (button.matches('[data-delete-option]')) {
      if (confirm('Are you sure you want to delete this option?')) {
        row.remove();
        this.save();
        this.updateButtonStates();
      }
    }
  };

  updateButtonStates() {
    const tbody = this.container.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach((row, index) => {
      const upButton = row.querySelector('[data-move-up]');
      const downButton = row.querySelector('[data-move-down]');

      if (upButton) {
        upButton.disabled = index === 0;
      }
      if (downButton) {
        downButton.disabled = index === rows.length - 1;
      }
    });
  };

  updatePreview() {
    if (!this.previewContainer) {
      console.error('Preview container not found');
      return;
    }

    const questionData = this.getQuestionData();
    if (!questionData) return;

    const options = questionData.options || [];
    const title = questionData.title || '';
    const hint = questionData.hint || '';
    const fieldType = questionData.fieldType || this.fieldType;

    let optionsHtml = '';
    if (fieldType === 'radio') {
      optionsHtml = options.map((option, index) => `
        <div class="govuk-radios__item">
          <input class="govuk-radios__input" 
                 id="option${index}" 
                 name="option" 
                 type="radio" 
                 value="${option.value || option.text}">
          <label class="govuk-label govuk-radios__label" for="option${index}">
            ${option.text}
          </label>
          ${option.hint ? `<div class="govuk-hint govuk-radios__hint">${option.hint}</div>` : ''}
        </div>
      `).join('');
    } else if (fieldType === 'checkbox') {
      optionsHtml = options.map((option, index) => `
        <div class="govuk-checkboxes__item">
          <input class="govuk-checkboxes__input" 
                 id="option${index}" 
                 name="option" 
                 type="checkbox" 
                 value="${option.value || option.text}">
          <label class="govuk-label govuk-checkboxes__label" for="option${index}">
            ${option.text}
          </label>
          ${option.hint ? `<div class="govuk-hint govuk-checkboxes__hint">${option.hint}</div>` : ''}
        </div>
      `).join('');
    } else if (fieldType === 'select') {
      optionsHtml = options.map(option => `
        <option value="${option.value || option.text}">${option.text}</option>
      `).join('');
    }

    const previewHtml = `
      <div class="govuk-form-group">
        <fieldset class="govuk-fieldset" aria-describedby="${hint ? 'question-hint' : ''}">
          <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
            <h1 class="govuk-fieldset__heading">${title || 'Question text'}</h1>
          </legend>
          ${hint ? `<div id="question-hint" class="govuk-hint">${hint}</div>` : ''}
          ${fieldType === 'select' 
            ? `<select class="govuk-select" id="question" name="question">${optionsHtml}</select>`
            : `<div class="govuk-${fieldType}s" data-module="govuk-${fieldType}s">${optionsHtml}</div>`
          }
        </fieldset>
      </div>
    `;

    this.previewContainer.innerHTML = previewHtml;
  };

  loadSavedOptions() {
    try {
      const questionData = this.getQuestionData();
      if (questionData && questionData.options) {
        if (questionData.options.length === 0) {
          this.showEmptyState();
        } else {
          this.render();
        }
      } else {
        this.showEmptyState();
      }
    } catch (error) {
      console.error('Error loading saved options:', error);
      this.showEmptyState();
    }
  }

  showEmptyState() {
    if (!this.$optionsList) return;

    const tbody = this.$optionsList.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr class="govuk-table__row">
          <td class="govuk-table__cell" colspan="2">No options added yet</td>
        </tr>
      `;
    }
  }

  importListOptions() {
    const select = this.container.querySelector('#import-list');
    if (!select) {
      console.error('Import list select not found');
      return;
    }

    const listId = select.value;
    if (!listId || !this.listsData || !this.listsData[listId]) {
      console.error('No list selected or list data not found');
      return;
    }

    const selectedList = this.listsData[listId];
    console.log('Importing list:', selectedList);

    // Get current data to preserve title and hint
    const questionData = this.getQuestionData() || {
      id: this.questionId,
      pageId: this.pageId,
      fieldType: this.fieldType,
      title: '',
      hint: '',
      options: []
    };

    // Create new data object with only unique options
    const newData = { ...questionData };
    const seenTexts = new Set();
    
    if (selectedList.options && Array.isArray(selectedList.options)) {
      newData.options = selectedList.options
        .filter(option => {
          const text = (option.text || option).trim();
          if (!text || seenTexts.has(text.toLowerCase())) return false;
          seenTexts.add(text.toLowerCase());
          return true;
        })
        .map(option => ({
          id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: (option.text || option).trim(),
          hint: option.hint || '',
          value: option.value || ''
        }));

      // Safely update storage and render
      if (this.safeUpdateStorage(newData)) {
        // Clear existing options and render new ones
        const tbody = this.container.querySelector('tbody');
        if (tbody) tbody.innerHTML = '';
        this.renderFromStorage();
      }
    }

    // Clear the select
    select.value = '';
  }

  addOption(option) {
    if (!option || !option.text || option.text.trim() === '') {
      console.log('Invalid option:', option);
      return;
    }

    const questionData = this.getQuestionData() || {
      id: this.questionId,
      pageId: this.pageId,
      fieldType: this.fieldType,
      title: '',
      hint: '',
      options: []
    };

    // Check for duplicates
    const isDuplicate = questionData.options.some(
      existingOption => existingOption.text.trim() === option.text.trim()
    );

    if (isDuplicate) {
      console.log('Duplicate option not added:', option.text);
      return;
    }

    // Add the new option
    questionData.options.push({
      id: option.id || `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: option.text.trim(),
      hint: option.hint || '',
      value: option.value || ''
    });

    // Save and render
    if (this.safeUpdateStorage(questionData)) {
      this.render();
    }
  }

  moveOption(optionId, direction) {
    const questionData = this.getQuestionData();
    if (!questionData || !questionData.options) return;

    const currentIndex = questionData.options.findIndex(option => option.id === optionId);
    if (currentIndex < 0) return;

    let newIndex = currentIndex;

    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < questionData.options.length - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      // Update the array order
      const [movedOption] = questionData.options.splice(currentIndex, 1);
      questionData.options.splice(newIndex, 0, movedOption);

      // Save to localStorage
      localStorage.setItem(this.questionId, JSON.stringify(questionData));

      // Refresh the display
      this.render();
    }
  }

  deleteOption(optionId) {
    const questionData = this.getQuestionData();
    if (!questionData || !questionData.options) return;

    const index = questionData.options.findIndex(option => option.id === optionId);
    if (index < 0) return;

    // Remove the option
    questionData.options.splice(index, 1);

    // Save to localStorage
    localStorage.setItem(this.questionId, JSON.stringify(questionData));

    // Refresh the display
    this.render();
  }
}

// Expose the OptionManager class
window.Prototype.OptionManager = OptionManager;

// Initialize all option editors on the page
document.addEventListener('DOMContentLoaded', function() {
  const $optionForms = document.querySelectorAll('[data-option-form]');
  $optionForms.forEach($form => {
    const optionEditor = new OptionEditor($form);
    optionEditor.init();
  });
});

function OptionEditor($module) {
  this.$module = $module;
  this.questionId = $module.querySelector('[name="questionId"]').value;
  this.optionId = $module.querySelector('[name="id"]')?.value || '';
  this.fieldType = $module.querySelector('[name="fieldType"]').value;
  this.pageId = $module.querySelector('[name="pageId"]').value;
}

OptionEditor.prototype.init = function() {
  if (!this.$module || !this.questionId) return;

  // Always try to load option data if we have an option ID
  if (this.optionId) {
    this.loadOptionData();
  }

  // Handle form submission
  this.$module.addEventListener('submit', (event) => {
    event.preventDefault();
    if (this.saveOption()) {
      window.location.href = `/question-editor/${this.questionId}/${this.fieldType}?pageId=${this.pageId}`;
    }
  });
}

OptionEditor.prototype.loadOptionData = function() {
  try {
    const savedData = localStorage.getItem(`form_${this.questionId}`);
    if (!savedData) return;

    const questionData = JSON.parse(savedData);
    if (!questionData || !questionData.options) return;

    // Find the option being edited
    const option = questionData.options.find(opt => opt.id === this.optionId);
    if (!option) return;

    // Set form field values
    this.$module.querySelector('[name="text"]').value = option.text || '';
    this.$module.querySelector('[name="value"]').value = option.value || '';
    this.$module.querySelector('[name="hint"]').value = option.hint || '';
  } catch (error) {
    console.error('Error loading option data:', error);
  }
}

OptionEditor.prototype.saveOption = function() {
  try {
    // Get current form data
    const formData = new FormData(this.$module);
    const optionText = formData.get('text') || '';
    
    const optionData = {
      id: this.optionId || `option_${Date.now()}`,
      text: optionText,
      value: formData.get('value') || optionText.toLowerCase().replace(/\s+/g, '-') || '',
      hint: formData.get('hint') || ''
    };

    // Get existing question data or create new question
    const savedData = localStorage.getItem(`form_${this.questionId}`);
    let questionData = savedData ? JSON.parse(savedData) : {
      id: this.questionId,
      fieldType: this.fieldType,
      pageId: this.pageId,
      title: '',
      options: []
    };

    // Ensure options array exists
    questionData.options = questionData.options || [];

    // Update or add the option
    const existingIndex = questionData.options.findIndex(opt => opt.id === optionData.id);
    if (existingIndex >= 0) {
      questionData.options[existingIndex] = optionData;
    } else {
      questionData.options.push(optionData);
    }

    // Save back to localStorage
    localStorage.setItem(`form_${this.questionId}`, JSON.stringify(questionData));

    // Update page data if needed
    const pageData = JSON.parse(localStorage.getItem(`page_${this.pageId}`) || '{}');
    pageData.questions = pageData.questions || [];
    
    const questionIndex = pageData.questions.findIndex(q => q.id === this.questionId);
    if (questionIndex >= 0) {
      pageData.questions[questionIndex] = questionData;
    } else {
      pageData.questions.push(questionData);
    }
    
    localStorage.setItem(`page_${this.pageId}`, JSON.stringify(pageData));

    return true;
  } catch (error) {
    console.error('Error saving option data:', error);
    return false;
  }
}
