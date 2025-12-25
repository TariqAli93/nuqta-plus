import { ref, watch } from 'vue';

/**
 * Composable for managing table column visibility and order
 * @param {String} tableId - Unique identifier for the table
 * @param {Array} defaultColumns - Default column configuration
 */
export function useTableColumns(tableId, defaultColumns = []) {
  const storageKey = `table-columns-${tableId}`;

  // Load saved preferences
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading column preferences:', error);
    }
    return null;
  };

  // Save preferences
  const savePreferences = (columns) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columns));
    } catch (error) {
      console.error('Error saving column preferences:', error);
    }
  };

  const savedPrefs = loadPreferences();
  const visibleColumns = ref(
    savedPrefs?.visible || defaultColumns.map((col) => col.key || col.value)
  );
  const columnOrder = ref(savedPrefs?.order || defaultColumns.map((col, index) => index));

  // Get visible columns in order
  const getVisibleColumns = () => {
    return columnOrder.value
      .map((index) => defaultColumns[index])
      .filter((col) => visibleColumns.value.includes(col.key || col.value));
  };

  // Toggle column visibility
  const toggleColumn = (columnKey) => {
    const index = visibleColumns.value.indexOf(columnKey);
    if (index > -1) {
      visibleColumns.value.splice(index, 1);
    } else {
      visibleColumns.value.push(columnKey);
    }
    savePreferences({
      visible: visibleColumns.value,
      order: columnOrder.value,
    });
  };

  // Reorder columns
  const reorderColumns = (newOrder) => {
    columnOrder.value = newOrder;
    savePreferences({
      visible: visibleColumns.value,
      order: columnOrder.value,
    });
  };

  // Reset to defaults
  const resetColumns = () => {
    visibleColumns.value = defaultColumns.map((col) => col.key || col.value);
    columnOrder.value = defaultColumns.map((col, index) => index);
    savePreferences({
      visible: visibleColumns.value,
      order: columnOrder.value,
    });
  };

  return {
    visibleColumns,
    columnOrder,
    getVisibleColumns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  };
}

