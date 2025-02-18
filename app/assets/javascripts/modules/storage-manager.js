// Storage management for options
class StorageManager {
  constructor() {
    this.validateData = this.validateData.bind(this);
  }

  getItem(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  setItem(key, data) {
    try {
      if (!this.validateData(data)) {
        console.error('Invalid data structure:', data);
        return false;
      }
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error writing to storage:', error);
      return false;
    }
  }

  validateData(data) {
    // Basic type check
    if (!data || typeof data !== 'object') return false;
    
    // Check if it's a page (has questions array)
    if (data.id && Array.isArray(data.questions)) {
      // Allow empty questions array or partially complete questions during editing
      if (data.questions.length === 0) return true;
      
      // For non-empty questions, ensure they're objects
      return data.questions.every(question => 
        question && typeof question === 'object'
      );
    }
    
    // Check if it's a question
    if (data.id) {
      // If it has options, just ensure it's an array
      if (data.options) {
        return Array.isArray(data.options);
      }
      return true;
    }
    
    // If it's a single option
    if (data.id && data.text) {
      return true;
    }
    
    // If none of the above patterns match, it's invalid
    return false;
  }

  safeUpdate(key, newData, existingData = null) {
    try {
      if (!key) {
        console.error('Cannot update storage: key not provided');
        return false;
      }

      // Get existing data if not provided
      if (!existingData) {
        existingData = this.getItem(key);
      }
      
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

      return this.setItem(key, newData);
    } catch (error) {
      console.error('Error in safe update:', error);
      return false;
    }
  }

  // Lists management
  getLists() {
    return this.getItem('lists') || {};
  }

  setLists(lists) {
    return this.setItem('lists', lists);
  }

  // Debug helper
  debugStorage() {
    console.log('Lists:', JSON.stringify(this.getLists(), null, 2));
    
    // Log all items except lists
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== 'lists') {
        console.log(`${key}:`, JSON.stringify(this.getItem(key), null, 2));
      }
    }
  }
}

// Export for use in other modules
window.Prototype = window.Prototype || {};
window.Prototype.StorageManager = StorageManager;
