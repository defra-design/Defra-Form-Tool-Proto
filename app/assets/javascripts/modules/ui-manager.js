// UI management for options
class UIManager {
  constructor() {
    this.eventHandlers = new Map();
  }

  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'classList' && Array.isArray(value)) {
        element.classList.add(...value);
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    if (content) element.innerHTML = content;
    return element;
  }

  createOptionRow(option, index, total, questionId, pageId, fieldType) {
    const row = this.createElement('tr', {
      classList: ['govuk-table__row'],
      dataset: { optionId: option.id }
    });
    
    row.innerHTML = `
      <td class="govuk-table__cell" style="vertical-align: middle;">
        <p class="govuk-body govuk-!-margin-0" data-option-text>${option.text}</p>
      </td>
      <td class="govuk-table__cell govuk-table__cell--numeric" style="white-space: nowrap;">
        <div class="govuk-button-group">
          <button type="button" class="govuk-button govuk-button--secondary govuk-!-margin-right-1" 
                  data-move-up 
                  ${index === 0 ? 'disabled' : ''}>
            ↑<span class="govuk-visually-hidden">Move up</span>
          </button>
          <button type="button" class="govuk-button govuk-button--secondary govuk-!-margin-right-1" 
                  data-move-down
                  ${index === total - 1 ? 'disabled' : ''}>
            ↓<span class="govuk-visually-hidden">Move down</span>
          </button>
          <a href="/option-editor/${fieldType}/${option.id}?questionId=${questionId}&pageId=${pageId}&returnUrl=/question-editor/${fieldType}/${questionId}%3FpageId=${pageId}" 
             class="govuk-button govuk-button--secondary govuk-!-margin-right-1"
             role="button">
            Edit<span class="govuk-visually-hidden"> ${option.text}</span>
          </a>
          <button type="button" class="govuk-button govuk-button--warning" data-delete>
            Delete<span class="govuk-visually-hidden"> ${option.text}</span>
          </button>
        </div>
      </td>
    `;
    
    return row;
  }

  updateButtonStates(tbody) {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach((row, index) => {
      const upButton = row.querySelector('[data-move-up]');
      const downButton = row.querySelector('[data-move-down]');
      
      if (upButton) upButton.disabled = index === 0;
      if (downButton) downButton.disabled = index === rows.length - 1;
    });
  }

  showEmptyState(container) {
    const tbody = container.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr class="govuk-table__row">
        <td class="govuk-table__cell" colspan="2">
          <p class="govuk-body">No options added yet</p>
        </td>
      </tr>
    `;
  }

  addEventHandler(element, event, handler) {
    if (!element || !event || !handler) return;
    
    const wrappedHandler = (e) => {
      handler(e);
      e.preventDefault();
    };
    
    element.addEventListener(event, wrappedHandler);
    this.eventHandlers.set(handler, wrappedHandler);
  }

  removeEventHandler(element, event, handler) {
    if (!element || !event || !handler) return;
    
    const wrappedHandler = this.eventHandlers.get(handler);
    if (wrappedHandler) {
      element.removeEventListener(event, wrappedHandler);
      this.eventHandlers.delete(handler);
    }
  }
}

// Export for use in other modules
window.Prototype = window.Prototype || {};
if (!window.Prototype.UIManager) {
  window.Prototype.UIManager = UIManager;
}
