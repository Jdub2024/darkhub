/**
 * storageService
 * 
 * Handles local persistence of funnel state to browser localStorage.
 * Includes serialization, validation, and version management.
 */

const STORAGE_KEY = 'desrg_funnel_state';
const STORAGE_VERSION = '1.0.0';

/**
 * Save funnel state to localStorage
 */
export const localStorageService = {
  saveFunnelState: (state) => {
    try {
      const serialized = JSON.stringify({
        version: STORAGE_VERSION,
        ...state,
      });
      localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save funnel state:', error);
      return false;
    }
  },

  /**
   * Load funnel state from localStorage
   */
  loadFunnelState: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      // Validate version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        console.warn(
          `Funnel state version mismatch: ${parsed.version} vs ${STORAGE_VERSION}`
        );
      }

      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        timestamp: parsed.timestamp,
      };
    } catch (error) {
      console.error('Failed to load funnel state:', error);
      return null;
    }
  },

  /**
   * Clear funnel state from localStorage
   */
  clearFunnelState: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear funnel state:', error);
      return false;
    }
  },

  /**
   * Get storage size in bytes
   */
  getStorageSize: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return new Blob([stored || '']).size;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Export state as JSON file
   */
  exportAsFile: (state) => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `desrg-funnel-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Import state from JSON file
   */
  importFromFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          resolve(imported);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },
};
