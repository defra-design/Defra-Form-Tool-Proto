const QuestionTemplates = {
  text: (question, title, hint) => `
    <div class="govuk-form-group">
      <h1 class="govuk-label-wrapper">
        <label class="govuk-label govuk-label--l" for="${question.id}">
          ${title}
        </label>
      </h1>
      ${hint ? `<div id="${question.id}-hint" class="govuk-hint">${hint}</div>` : ''}
      <input class="govuk-input" id="${question.id}" name="${question.id}" type="text"
        ${hint ? `aria-describedby="${question.id}-hint"` : ''}>
    </div>
  `,

  email: (question, title, hint) => `
    <div class="govuk-form-group">
      <h1 class="govuk-label-wrapper">
        <label class="govuk-label govuk-label--l" for="${question.id}">
          ${title}
        </label>
      </h1>
      ${hint ? `<div id="${question.id}-hint" class="govuk-hint">${hint}</div>` : ''}
      <input class="govuk-input" id="${question.id}" name="${question.id}" type="email"
        ${hint ? `aria-describedby="${question.id}-hint"` : ''}>
    </div>
  `,

  textarea: (question, title, hint) => `
    <div class="govuk-form-group">
      <h1 class="govuk-label-wrapper">
        <label class="govuk-label govuk-label--l" for="${question.id}">
          ${title}
        </label>
      </h1>
      ${hint ? `<div id="${question.id}-hint" class="govuk-hint">${hint}</div>` : ''}
      <textarea class="govuk-textarea" id="${question.id}" name="${question.id}" rows="5"
        ${hint ? `aria-describedby="${question.id}-hint"` : ''}></textarea>
    </div>
  `,

  radio: (question, title, hint) => `
    <div class="govuk-form-group">
      <fieldset class="govuk-fieldset" ${hint ? `aria-describedby="${question.id}-hint"` : ''}>
        <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
          <h1 class="govuk-fieldset__heading">
            ${title}
          </h1>
        </legend>
        ${hint ? `<div id="${question.id}-hint" class="govuk-hint">${hint}</div>` : ''}
        <div class="govuk-radios" data-module="govuk-radios">
          ${(question.options || []).map((option, i) => {
            const optionText = typeof option === 'object' ? option.text : option;
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionHint = typeof option === 'object' ? option.hint : '';
            return `
              <div class="govuk-radios__item">
                <input class="govuk-radios__input" id="${question.id}-${i}" name="${question.id}" 
                  type="radio" value="${optionValue}"
                  ${optionHint ? `aria-describedby="${question.id}-${i}-hint"` : ''}>
                <label class="govuk-label govuk-radios__label" for="${question.id}-${i}">
                  ${optionText}
                </label>
                ${optionHint ? `
                  <div id="${question.id}-${i}-hint" class="govuk-hint govuk-radios__hint">
                    ${optionHint}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </fieldset>
    </div>
  `,

  checkbox: (question, title, hint) => `
    <div class="govuk-form-group">
      <fieldset class="govuk-fieldset" ${hint ? `aria-describedby="${question.id}-hint"` : ''}>
        <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
          <h1 class="govuk-fieldset__heading">
            ${title}
          </h1>
        </legend>
        ${hint ? `<div id="${question.id}-hint" class="govuk-hint">${hint}</div>` : ''}
        <div class="govuk-checkboxes" data-module="govuk-checkboxes">
          ${(question.options || []).map((option, i) => {
            const optionText = typeof option === 'object' ? option.text : option;
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionHint = typeof option === 'object' ? option.hint : '';
            return `
              <div class="govuk-checkboxes__item">
                <input class="govuk-checkboxes__input" id="${question.id}-${i}" name="${question.id}" 
                  type="checkbox" value="${optionValue}"
                  ${optionHint ? `aria-describedby="${question.id}-${i}-hint"` : ''}>
                <label class="govuk-label govuk-checkboxes__label" for="${question.id}-${i}">
                  ${optionText}
                </label>
                ${optionHint ? `
                  <div id="${question.id}-${i}-hint" class="govuk-hint govuk-checkboxes__hint">
                    ${optionHint}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </fieldset>
    </div>
  `,

  select: (question, title, hint) => `
    <div class="govuk-form-group">
      <h1 class="govuk-label-wrapper">
        <label class="govuk-label govuk-label--l" for="${question.id}">
          ${title}
        </label>
      </h1>
      ${hint ? `<div id="${question.id}-hint" class="govuk-hint">${hint}</div>` : ''}
      <select class="govuk-select" id="${question.id}" name="${question.id}"
        ${hint ? `aria-describedby="${question.id}-hint"` : ''}>
        <option value="">Please select</option>
        ${(question.options || []).map(option => {
          const optionText = typeof option === 'object' ? option.text : option;
          const optionValue = typeof option === 'object' ? option.value : option;
          return `<option value="${optionValue}">${optionText}</option>`;
        }).join('')}
      </select>
    </div>
  `,

  date: (question, title, hint) => `
    <div class="govuk-form-group">
      <fieldset class="govuk-fieldset" role="group" ${hint ? `aria-describedby="${question.id}-hint"` : ''}>
        <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
          <h1 class="govuk-fieldset__heading">
            ${title}
          </h1>
        </legend>
        ${hint ? `<div id="${question.id}-hint" class="govuk-hint">${hint}</div>` : ''}
        <div class="govuk-date-input" id="${question.id}">
          <div class="govuk-date-input__item">
            <div class="govuk-form-group">
              <label class="govuk-label govuk-date-input__label" for="${question.id}-day">Day</label>
              <input class="govuk-input govuk-date-input__input govuk-input--width-2" 
                id="${question.id}-day" name="${question.id}-day" type="text" 
                pattern="[0-9]*" inputmode="numeric">
            </div>
          </div>
          <div class="govuk-date-input__item">
            <div class="govuk-form-group">
              <label class="govuk-label govuk-date-input__label" for="${question.id}-month">Month</label>
              <input class="govuk-input govuk-date-input__input govuk-input--width-2" 
                id="${question.id}-month" name="${question.id}-month" type="text" 
                pattern="[0-9]*" inputmode="numeric">
            </div>
          </div>
          <div class="govuk-date-input__item">
            <div class="govuk-form-group">
              <label class="govuk-label govuk-date-input__label" for="${question.id}-year">Year</label>
              <input class="govuk-input govuk-date-input__input govuk-input--width-4" 
                id="${question.id}-year" name="${question.id}-year" type="text" 
                pattern="[0-9]*" inputmode="numeric">
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  `
}
