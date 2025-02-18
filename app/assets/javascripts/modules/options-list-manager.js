// Options list management
class OptionsListManager {
  constructor(container, storageManager, uiManager, previewManager) {
    if (!container) throw new Error('Container element is required');
    if (!storageManager) throw new Error('StorageManager is required');
    if (!uiManager) throw new Error('UIManager is required');
    if (!previewManager) throw new Error('PreviewManager is required');

    this.container = container;
    this.storage = storageManager;
    this.ui = uiManager;
    this.preview = previewManager;

    this.questionId = null;
    this.pageId = null;
    this.fieldType = null;

    // Bind methods
    this.init = this.init.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.importListOptions = this.importListOptions.bind(this);
    this.loadSavedOptions = this.loadSavedOptions.bind(this);
    this.save = this.save.bind(this);
  }

  init() {
    // Initialize lists dropdown
    this.initializeLists();
    
    // Load any saved options
    this.loadSavedOptions();

    // Set up import button handler
    const importButton = this.container.querySelector('[data-import-list]');
    if (importButton) {
      this.ui.addEventHandler(importButton, 'click', this.importListOptions);
    }

    // Set up click handler for the options table
    this.container.addEventListener('click', this.handleClick);
  }

  initializeLists() {
    const listsSelect = this.container.querySelector('[data-lists]');
    if (!listsSelect) return;

    const lists = this.storage.getLists();
    if (!lists || Object.keys(lists).length === 0) {
      console.warn('No lists available');
      return;
    }

    listsSelect.innerHTML = `
      <option value="">Select a list to import</option>
      ${Object.entries(lists).map(([id, list]) => `
        <option value="${id}">${list.name || id}</option>
      `).join('')}
    `;
  }

  loadSavedOptions() {
    // Get the page data first
    const pageData = this.storage.getItem(this.pageId);
    if (!pageData || !pageData.questions) {
      this.ui.showEmptyState(this.container);
      return;
    }

    // Find the question in the page data
    const questionData = pageData.questions.find(q => q.id === this.questionId);
    if (!questionData || !questionData.options) {
      this.ui.showEmptyState(this.container);
      return;
    }

    const tbody = this.container.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    questionData.options.forEach((option, index) => {
      const row = this.ui.createOptionRow(
        option, 
        index, 
        questionData.options.length,
        this.questionId,
        this.pageId,
        this.fieldType
      );
      tbody.appendChild(row);
    });

    // Also update the question data in localStorage for backwards compatibility
    this.storage.setItem(this.questionId, questionData);
    this.preview.update(questionData);
  }

  handleClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    // Prevent form submission
    event.preventDefault();
    event.stopPropagation();

    const row = button.closest('tr');
    if (!row) return;

    const tbody = row.parentNode;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const currentIndex = rows.indexOf(row);

    if (button.matches('[data-move-up]') && !button.disabled && currentIndex > 0) {
      tbody.insertBefore(row, rows[currentIndex - 1]);
      this.ui.updateButtonStates(tbody);
      this.save();
    } else if (button.matches('[data-move-down]') && !button.disabled && currentIndex < rows.length - 1) {
      tbody.insertBefore(rows[currentIndex + 1], row);
      this.ui.updateButtonStates(tbody);
      this.save();
    } else if (button.matches('[data-delete]')) {
      if (confirm('Are you sure you want to delete this option?')) {
        row.remove();
        this.ui.updateButtonStates(tbody);
        this.save();
      }
    }
  }

  importListOptions() {
    const listSelect = this.container.querySelector('[data-lists]');
    if (!listSelect) return;

    const listId = listSelect.value;
    if (!listId) {
      alert('Please select a list to import');
      return;
    }

    const lists = this.storage.getLists();
    if (!lists || !lists[listId]) {
      alert('Selected list not found');
      return;
    }

    // Get the current page data
    const pageData = this.storage.getItem(this.pageId) || {
      id: this.pageId,
      title: '',
      questions: []
    };

    // Find or create the question in the page data
    let questionData = pageData.questions.find(q => q.id === this.questionId);
    if (!questionData) {
      questionData = {
        id: this.questionId,
        pageId: this.pageId,
        fieldType: this.fieldType,
        title: document.querySelector('[data-question-title]')?.value || '',
        hint: document.querySelector('[data-question-hint]')?.value || '',
        options: []
      };
      pageData.questions.push(questionData);
    }

    // Add new options
    const newOptions = lists[listId].options.map(option => ({
      id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: option.text,
      value: option.value || option.text,
      hint: option.hint || ''
    }));

    // Confirm if there are existing options
    if (questionData.options && questionData.options.length > 0) {
      if (confirm('Do you want to replace existing options?')) {
        questionData.options = newOptions;
      } else {
        questionData.options = [...questionData.options, ...newOptions];
      }
    } else {
      questionData.options = newOptions;
    }

    // Update the question in the page data
    const questionIndex = pageData.questions.findIndex(q => q.id === this.questionId);
    if (questionIndex !== -1) {
      pageData.questions[questionIndex] = questionData;
    }

    // Save the updated page data
    if (this.storage.setItem(this.pageId, pageData)) {
      // Also save to question ID for backwards compatibility
      this.storage.setItem(this.questionId, questionData);
      this.loadSavedOptions();
      this.preview.update(questionData);
    }
  }

  save() {
    // Get the current page data
    const pageData = this.storage.getItem(this.pageId) || {
      id: this.pageId,
      title: '',
      questions: []
    };

    // Find or create the question in the page data
    let questionData = pageData.questions.find(q => q.id === this.questionId);
    if (!questionData) {
      questionData = {
        id: this.questionId,
        pageId: this.pageId,
        fieldType: this.fieldType,
        title: '',
        hint: '',
        options: []
      };
      pageData.questions.push(questionData);
    }

    // Get current title and hint
    const titleInput = document.querySelector('[data-question-title]');
    const hintInput = document.querySelector('[data-question-hint]');
    if (titleInput) questionData.title = titleInput.value;
    if (hintInput) questionData.hint = hintInput.value;

    // Get current options from the table
    const tbody = this.container.querySelector('tbody');
    if (tbody) {
      const currentOptionIds = Array.from(tbody.querySelectorAll('tr')).map(row => row.dataset.optionId);
      
      // Reorder options based on current table order
      questionData.options = currentOptionIds.map(optionId => {
        const optionRow = tbody.querySelector(`tr[data-option-id="${optionId}"]`);
        if (!optionRow) return null;

        const textElement = optionRow.querySelector('[data-option-text]');
        if (!textElement) return null;

        const text = textElement.textContent;
        return {
          id: optionId,
          text: text,
          value: text // Use text as value for now
        };
      }).filter(Boolean);
    }

    // Update the question in the page data
    const questionIndex = pageData.questions.findIndex(q => q.id === this.questionId);
    if (questionIndex !== -1) {
      pageData.questions[questionIndex] = questionData;
    }

    // Save the updated page data
    if (this.storage.setItem(this.pageId, pageData)) {
      // Also save to question ID for backwards compatibility
      this.storage.setItem(this.questionId, questionData);
      this.preview.update(questionData);
      return questionData;
    }
    return null;
  }
}

// Export for use in other modules
window.Prototype = window.Prototype || {};
window.Prototype.OptionsListManager = OptionsListManager;
