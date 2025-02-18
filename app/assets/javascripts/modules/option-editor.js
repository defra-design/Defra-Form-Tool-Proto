// Option editor management
class OptionEditor {
  constructor(form, storageManager, previewManager = null) {
    if (!form || !(form instanceof HTMLFormElement)) throw new Error('Form element is required');
    if (!storageManager) throw new Error('StorageManager is required');

    this.form = form;
    this.storage = storageManager;
    this.preview = previewManager;
    this.questionId = form.querySelector('[name="questionId"]')?.value;
    this.optionId = form.querySelector('[name="id"]')?.value || '';
    this.fieldType = form.querySelector('[name="fieldType"]')?.value;
    this.pageId = form.querySelector('[name="pageId"]')?.value;
    
    console.log('OptionEditor constructed with:', {
      questionId: this.questionId,
      optionId: this.optionId,
      fieldType: this.fieldType,
      pageId: this.pageId
    });

    // Bind methods
    this.init = this.init.bind(this);
    this.loadOptionData = this.loadOptionData.bind(this);
    this.saveOption = this.saveOption.bind(this);
  }

  init() {
    console.log('Initializing OptionEditor with:', {
      questionId: this.questionId,
      optionId: this.optionId,
      fieldType: this.fieldType,
      pageId: this.pageId
    });
    
    this.loadOptionData();
    
    this.form.addEventListener('submit', (e) => {
      console.log('Form submitted');
      e.preventDefault();
      e.stopPropagation();
      if (this.saveOption()) {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        if (returnUrl) {
          window.location.href = returnUrl;
        }
      }
    });
  }

  loadOptionData() {
    if (!this.questionId || !this.optionId) return;

    const questionData = this.storage.getItem(this.questionId);
    if (!questionData || !questionData.options) return;

    const option = questionData.options.find(opt => opt.id === this.optionId);
    if (!option) return;

    // Populate form fields
    const textInput = this.form.querySelector('[name="text"]');
    const valueInput = this.form.querySelector('[name="value"]');
    const hintInput = this.form.querySelector('[name="hint"]');

    if (textInput) textInput.value = option.text || '';
    if (valueInput) valueInput.value = option.value || '';
    if (hintInput) hintInput.value = option.hint || '';
  }

  saveOption() {
    if (!this.questionId) {
      console.error('Question ID not found');
      return false;
    }

    const textInput = this.form.querySelector('[name="text"]');
    const valueInput = this.form.querySelector('[name="value"]');
    const hintInput = this.form.querySelector('[name="hint"]');

    if (!textInput || !textInput.value.trim()) {
      alert('Option text is required');
      return false;
    }

    // Get or initialize question data
    const questionData = this.storage.getItem(this.questionId) || {
      id: this.questionId,
      pageId: this.pageId,
      fieldType: this.fieldType,
      title: '',
      hint: '',
      options: []
    };

    const optionData = {
      id: this.optionId || `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: textInput.value.trim(),
      value: valueInput?.value.trim() || textInput.value.trim(),
      hint: hintInput?.value.trim() || ''
    };

    // Update or add the option
    if (!questionData.options) questionData.options = [];
    
    const existingIndex = questionData.options.findIndex(opt => opt.id === optionData.id);
    if (existingIndex >= 0) {
      questionData.options[existingIndex] = optionData;
    } else {
      questionData.options.push(optionData);
    }

    // Save and update preview
    console.log('Saving option:', optionData);
    console.log('Question data:', questionData);
    
    if (this.storage.safeUpdate(this.questionId, questionData)) {
      if (this.preview) {
        this.preview.update(questionData);
      }
      console.log('Option saved successfully');
      return true;
    }
    console.error('Failed to save option');
    return false;
  }
}

// Export for use in other modules
window.Prototype = window.Prototype || {};
if (!window.Prototype.OptionEditor) {
  window.Prototype.OptionEditor = OptionEditor;
}
