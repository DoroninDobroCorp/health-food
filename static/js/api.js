/**
 * A helper function to handle GET API requests.
 * @param {string} endpoint The API endpoint to fetch data from.
 * @returns {Promise<any>} The JSON response from the API.
 */
async function getAPI(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

/**
 * A helper function to handle POST API requests.
 * @param {string} endpoint The API endpoint to post data to.
 * @param {FormData|string} body The body of the request.
 * @param {boolean} isFormData Whether the body is FormData or a JSON string.
 * @returns {Promise<any>} The JSON response from the API.
 */
async function postAPI(endpoint, body, isFormData = true) {
  const options = {
    method: 'POST',
    body: body,
  };
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }

  const response = await fetch(endpoint, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * Fetches plan recommendations from the API.
 * @param {FormData} formData The form data containing labs, preferences, etc.
 * @returns {Promise<any>}
 */
export function generatePlan(formData) {
  return postAPI('/api/generate', formData);
}

/**
 * Generates AI recipes from the API.
 * @param {FormData} formData The form data containing labs, available products, etc.
 * @returns {Promise<any>}
 */
export function generateAIrecipes(formData) {
  return postAPI('/api/generate', formData);
}

/**
 * Analyzes a photo of products using the API.
 * @param {FormData} formData The form data containing the photo, labs, and preferences.
 * @returns {Promise<any>}
 */
export function analyzePhoto(formData) {
  return postAPI('/api/generate', formData);
}

/**
 * Saves the user's profile.
 * @param {FormData} formData The profile form data.
 * @returns {Promise<Response>}
 */
export function saveProfile(formData) {
  return fetch('/api/profile', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Loads the user's profile data.
 * @returns {Promise<any>}
 */
export function loadProfileData() {
  return getAPI('/api/profile');
}

/**
 * Saves lab results and sets a reminder.
 * @param {FormData} formData The labs and weeks form data.
 * @returns {Promise<Response>}
 */
export function saveLabs(formData) {
  return fetch('/api/labs/save', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Loads upcoming reminders.
 * @returns {Promise<any>}
 */
export function loadRemindersData() {
  return getAPI('/api/reminders/upcoming');
}

/**
 * Sends a message to the AI nutritionist and gets a recommendation.
 * @param {object} payload The message payload including context and thread_id.
 * @returns {Promise<any>}
 */
export function getVitaminRecommendations(payload) {
  return postAPI('/api/vitamins/recommendations', JSON.stringify(payload), false);
} 