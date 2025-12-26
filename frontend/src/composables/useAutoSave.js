import { ref, onBeforeUnmount } from 'vue';

/**
 * Composable for auto-save functionality
 * @param {Function} saveFunction - Function to call for saving
 * @param {Number} interval - Auto-save interval in milliseconds
 * @param {Boolean} enabled - Whether auto-save is enabled
 */
export function useAutoSave(saveFunction, interval = 30000, enabled = true) {
  const isSaving = ref(false);
  const lastSaved = ref(null);
  const hasUnsavedChanges = ref(false);
  const saveError = ref(null);
  let saveTimer = null;
  let debounceTimer = null;

  const save = async () => {
    if (!enabled || isSaving.value) return;

    isSaving.value = true;
    saveError.value = null;

    try {
      await saveFunction();
      lastSaved.value = new Date();
      hasUnsavedChanges.value = false;
    } catch (error) {
      saveError.value = error;
      console.error('Auto-save error:', error);
    } finally {
      isSaving.value = false;
    }
  };

  const markAsChanged = () => {
    hasUnsavedChanges.value = true;

    // Debounce auto-save
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      if (hasUnsavedChanges.value) {
        save();
      }
    }, 2000); // Save 2 seconds after last change
  };

  const startAutoSave = () => {
    if (!enabled) return;

    stopAutoSave();
    saveTimer = setInterval(() => {
      if (hasUnsavedChanges.value && !isSaving.value) {
        save();
      }
    }, interval);
  };

  const stopAutoSave = () => {
    if (saveTimer) {
      clearInterval(saveTimer);
      saveTimer = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  onBeforeUnmount(() => {
    stopAutoSave();
  });

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveError,
    save,
    markAsChanged,
    startAutoSave,
    stopAutoSave,
  };
}
