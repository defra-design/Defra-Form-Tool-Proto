// Preview management for form fields
window.Prototype = window.Prototype || {};

class PreviewManager {
  constructor(container) {
    this.container = container;
  }

  update(data) {
    if (!data || !this.container) return;

    const { title = '', hint = '', fieldType = 'text', options = [] } = data;
    let inputHtml = '';

    // Handle different field types
    switch(fieldType) {
      case 'date':
        inputHtml = `
          <div class="govuk-date-input" id="question">
            <div class="govuk-date-input__item">
              <div class="govuk-form-group">
                <label class="govuk-label govuk-date-input__label" for="question-day">Day</label>
                <input class="govuk-input govuk-date-input__input govuk-input--width-2" 
                       id="question-day" name="question-day" type="text" pattern="[0-9]*" inputmode="numeric">
              </div>
            </div>
            <div class="govuk-date-input__item">
              <div class="govuk-form-group">
                <label class="govuk-label govuk-date-input__label" for="question-month">Month</label>
                <input class="govuk-input govuk-date-input__input govuk-input--width-2" 
                       id="question-month" name="question-month" type="text" pattern="[0-9]*" inputmode="numeric">
              </div>
            </div>
            <div class="govuk-date-input__item">
              <div class="govuk-form-group">
                <label class="govuk-label govuk-date-input__label" for="question-year">Year</label>
                <input class="govuk-input govuk-date-input__input govuk-input--width-4" 
                       id="question-year" name="question-year" type="text" pattern="[0-9]*" inputmode="numeric">
              </div>
            </div>
          </div>`;
        break;

      case 'radio':
      case 'checkbox':
        const componentName = fieldType === 'checkbox' ? 'checkboxes' : 'radios';
        inputHtml = `
          <div class="govuk-${componentName}" data-module="govuk-${componentName}">
            ${options.map((option, index) => {
              const optionId = `question-${index}`;
              const hintId = option.hint ? `${optionId}-hint` : '';
              return `
                <div class="govuk-${componentName}__item">
                  <input class="govuk-${componentName}__input" 
                         id="${optionId}" 
                         name="question"
                         type="${fieldType}" 
                         value="${option.value || option.text}"
                         ${option.hint ? `aria-describedby="${hintId}"` : ''}>
                  <label class="govuk-label govuk-${componentName}__label" for="${optionId}">
                    ${option.text}
                  </label>
                  ${option.hint ? `
                    <div id="${hintId}" class="govuk-hint govuk-${componentName}__hint">
                      ${option.hint}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>`;
        break;

      case 'select':
        inputHtml = `
          <select class="govuk-select" id="question" name="question">
            ${options.map(option => `<option value="${option.value || option.text}">${option.text}</option>`).join('')}
          </select>`;
        break;

      case 'autocomplete':
        inputHtml = `
          <select class="govuk-select" id="question" name="question">
            <option value="">Please select</option>
            ${options.map(option => `<option value="${option.value || option.text}">${option.text}</option>`).join('')}
          </select>`;
        // Initialize autocomplete after rendering
        const observer = new MutationObserver((mutations, obs) => {
          const selectElement = this.container.querySelector('select');
          if (selectElement && !selectElement.classList.contains('autocomplete-enhanced')) {
            if (typeof accessibleAutocomplete !== 'undefined') {
              accessibleAutocomplete.enhanceSelectElement({
                selectElement: selectElement,
                minLength: 2,
                defaultValue: '',
                showAllValues: true,
                autoselect: false
              });
              selectElement.classList.add('autocomplete-enhanced');
              obs.disconnect(); // Stop observing once we've enhanced
            }
          }
        });
        observer.observe(this.container, { childList: true, subtree: true });
        break;

      case 'textarea':
        inputHtml = `<textarea class="govuk-textarea" id="question" name="question" rows="5"></textarea>`;
        break;

      case 'file':
        inputHtml = `<input class="govuk-file-upload" id="question" name="question" type="file">`;
        break;

      default:
        // text, email, tel, number
        inputHtml = `<input class="govuk-input" id="question" name="question" type="${fieldType}">`;
    }

    // Generate the preview HTML
    const needsFieldset = ['radio', 'checkbox', 'date'].includes(fieldType);
    const previewHtml = `
      <div class="govuk-form-group">
        ${needsFieldset ? `
          <fieldset class="govuk-fieldset" role="group" aria-describedby="${hint ? 'question-hint' : ''}">
            <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
              <h1 class="govuk-fieldset__heading">${title || 'Question text'}</h1>
            </legend>
        ` : `
          <h1 class="govuk-label-wrapper">
            <label class="govuk-label govuk-label--l" for="question">
              ${title || 'Question text'}
            </label>
          </h1>
        `}
        ${hint ? `<div id="question-hint" class="govuk-hint">${hint}</div>` : ''}
        ${inputHtml}
        ${needsFieldset ? '</fieldset>' : ''}
      </div>
    `;

    this.container.innerHTML = previewHtml;
  }
}

window.Prototype.PreviewManager = PreviewManager;
