// Autocomplete field enhancement
window.Prototype = window.Prototype || {};

class AutocompleteManager {
  constructor() {
    // Bind methods
    this.initializeAutocompletes = this.initializeAutocompletes.bind(this);
    this.initializeAutocomplete = this.initializeAutocomplete.bind(this);
    this.tryInitialize = this.tryInitialize.bind(this);

    // Try to initialize immediately
    this.tryInitialize();

    // Try again when DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.tryInitialize);
    }

    // Watch for new elements
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Look for new selects in added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check the node itself
            if (node.tagName === 'SELECT' && node.hasAttribute('data-autocomplete')) {
              this.initializeAutocomplete(node);
            }
            // Check children
            node.querySelectorAll('select[data-autocomplete]').forEach(this.initializeAutocomplete);
          }
        });

        // Also check modified nodes (in case data-autocomplete was added)
        if (mutation.target.nodeType === 1) {
          if (mutation.target.tagName === 'SELECT' && mutation.target.hasAttribute('data-autocomplete')) {
            this.initializeAutocomplete(mutation.target);
          }
          mutation.target.querySelectorAll('select[data-autocomplete]').forEach(this.initializeAutocomplete);
        }
      });
    });

    // Start observing the entire document
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-autocomplete']
    });

    // Also check periodically for any missed elements
    setInterval(this.tryInitialize, 1000);
  }

  tryInitialize() {
    if (typeof accessibleAutocomplete !== 'undefined') {
      this.initializeAutocompletes();
    }
  }

  initializeAutocomplete(select) {
    // Skip if already enhanced
    if (select.classList.contains('autocomplete-enhanced')) {
      return;
    }

    // Skip if not an autocomplete select
    if (!select.hasAttribute('data-autocomplete')) {
      return;
    }

    try {
      // Enhance the select
      accessibleAutocomplete.enhanceSelectElement({
        selectElement: select,
        minLength: 2,
        defaultValue: '',
        showAllValues: true,
        autoselect: false
      });

      // Mark as enhanced
      select.classList.add('autocomplete-enhanced');
    } catch (error) {
      console.warn('Could not enhance autocomplete select:', error);
    }
  }

  initializeAutocompletes() {
    // Initialize all autocomplete selects that aren't enhanced yet
    document.querySelectorAll('select[data-autocomplete]:not(.autocomplete-enhanced)').forEach(this.initializeAutocomplete);
  }
}

// Create a single instance
window.autocompleteManager = new AutocompleteManager();

window.Prototype.AutocompleteManager = AutocompleteManager;
