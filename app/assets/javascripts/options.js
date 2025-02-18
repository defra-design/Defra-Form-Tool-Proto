// Main options management for GOV.UK Prototype Kit
(function(window) {
  'use strict';

  // Initialize Prototype namespace if it doesn't exist
  window.Prototype = window.Prototype || {};

  // Main initialization function
  function initializeOptions() {
    try {
      // Initialize managers for options list pages
      const optionsContainers = document.querySelectorAll('[data-options-list]');
      if (optionsContainers.length > 0) {
        optionsContainers.forEach(container => {
          try {
            const storageManager = new window.Prototype.StorageManager();
            const uiManager = new window.Prototype.UIManager();
            const previewContainer = document.querySelector('[data-question-preview]');
            const previewManager = new window.Prototype.PreviewManager(previewContainer);
            
            const optionsManager = new window.Prototype.OptionsListManager(
              container,
              storageManager,
              uiManager,
              previewManager
            );

            // Set required properties from data attributes
            optionsManager.questionId = container.getAttribute('data-question-id');
            optionsManager.pageId = container.getAttribute('data-page-id');
            optionsManager.fieldType = container.getAttribute('data-field-type');

            optionsManager.init();
          } catch (error) {
            console.error('Error initializing options container:', error);
          }
        });
      }

      // Initialize editors for option edit pages
      const editorContainers = document.querySelectorAll('[data-option-editor]');
      if (editorContainers.length > 0) {
        editorContainers.forEach(container => {
          try {
            const storageManager = new window.Prototype.StorageManager();
            const previewContainer = document.querySelector('[data-question-preview]');
            const previewManager = new window.Prototype.PreviewManager(previewContainer);
            const editor = new window.Prototype.OptionEditor(container, storageManager, previewManager);
            editor.init();
          } catch (error) {
            console.error('Error initializing editor container:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error in initializeOptions:', error);
    }
  }

  // Initialize default lists if none exist
  function initializeDefaultLists() {
    // Only initialize if StorageManager exists
    if (!window.Prototype || !window.Prototype.StorageManager) {
      console.log('StorageManager not available, skipping default lists initialization');
      return;
    }

    const storageManager = new window.Prototype.StorageManager();
    const lists = storageManager.getLists();
    
    if (Object.keys(lists).length === 0) {
      const defaultLists = {
        yes_no: {
          name: 'Yes/No',
          options: [
            { text: 'Yes', value: 'yes', hint: 'Select this if you agree' },
            { text: 'No', value: 'no', hint: 'Select this if you disagree' }
          ]
        },
        days: {
          name: 'Days of Week',
          options: [
            { text: 'Monday', value: 'mon', hint: 'Start of the work week' },
            { text: 'Tuesday', value: 'tue', hint: 'Second day' },
            { text: 'Wednesday', value: 'wed', hint: 'Middle of the week' },
            { text: 'Thursday', value: 'thu', hint: 'Fourth day' },
            { text: 'Friday', value: 'fri', hint: 'Last work day' },
            { text: 'Saturday', value: 'sat', hint: 'Weekend starts' },
            { text: 'Sunday', value: 'sun', hint: 'End of the week' }
          ]
        }
      };
      storageManager.setLists(defaultLists);
      console.log('Initialized default lists');
      storageManager.debugStorage();
    }
  }

  // Initialize when DOM is ready and only if we have options containers
  function shouldInitialize() {
    return document.querySelector('[data-options-list], [data-option-editor]') !== null;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (shouldInitialize()) {
        initializeDefaultLists();
        initializeOptions();
      }
    });
  } else if (shouldInitialize()) {
    initializeDefaultLists();
    initializeOptions();
  }

})(window);
