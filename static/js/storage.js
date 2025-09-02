const STORAGE_KEY = 'healthFoodAppData';

/**
 * Saves the application state to localStorage.
 * @param {object} data - The data to save (should be JSON-serializable).
 */
export function saveData(data) {
  try {
    const appData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, appData);
  } catch (error) {
    console.error("Could not save data to localStorage", error);
  }
}

/**
 * Loads the application state from localStorage.
 * @returns {object|undefined} The saved data object, or undefined if nothing is stored or an error occurs.
 */
export function loadData() {
  try {
    const appData = localStorage.getItem(STORAGE_KEY);
    if (appData === null) {
      return undefined; // No data found
    }
    return JSON.parse(appData);
  } catch (error) {
    console.error("Could not load data from localStorage", error);
    return undefined;
  }
}
