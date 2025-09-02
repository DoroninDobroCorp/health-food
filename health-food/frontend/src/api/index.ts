const BASE_URL = import.meta.env.VITE_BACKEND_URL;

import type { PlanItem } from "../store/slices/appSlice";
import type { Biomarkers, PhotoAnalysisResponse, Preferences, User, Recipe } from "./types";
import { getToken } from "../store/localStorage";

function withBaseUrl(endpoint: string) {
  return `${BASE_URL}${endpoint}`;
}

async function getAPI(endpoint: string) {
    const url = withBaseUrl(endpoint);
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method: 'GET',
        headers,
    };

    const response = await fetch(url, options);
    if (!response.ok) {
        if (response.status === 401) {
            // Здесь можно будет обрабатывать истекший токен, например, делая logout
        }
        const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }
    return response.json();
}


async function postAPI(endpoint: string, body: FormData) {
  const url = withBaseUrl(endpoint);
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method: 'POST',
    headers: headers,
    body: body,
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  return response.json();
}

async function postJsonAPI(endpoint: string, body: object) {
  const url = withBaseUrl(endpoint);
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: headers,
  };

  const response = await fetch(url, options);
  const responseData = await response.json().catch(() => ({})); // Catch if no body

  if (!response.ok) {
    // Instead of throwing, we return an object with an error flag and the data
    return {
        ok: false,
        status: response.status,
        data: responseData,
    };
  }

  return {
      ok: true,
      status: response.status,
      data: responseData,
  };
}

async function putJsonAPI(endpoint: string, body: object) {
    const url = withBaseUrl(endpoint);
    const token = getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: headers,
    };

    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }
    return response.json();
}

async function deleteAPI(endpoint: string) {
    const url = withBaseUrl(endpoint);
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method: 'DELETE',
        headers: headers,
    };

    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }
    // DELETE requests might not return a body, so we don't try to parse json if the response is ok.
    return response;
}

export function generatePlan(formData: FormData) {
  return postAPI('/api/generate', formData);
}

export function getVitaminRecommendations(payload: object) {
  return postJsonAPI('/api/vitamins/recommendations', payload);
}

export function loadRemindersData() {
  return getAPI('/api/reminders/upcoming');
}

export function saveLabs(formData: FormData) {
  // This seems to return a response object, not json, let's keep it that way for now.
  const url = withBaseUrl('/api/labs/save');
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
}

export function loadProfileData() {
  return getAPI('/auth/users/me');
}

export function saveProfile(formData: FormData) {
    // This seems to return a response object, not json, let's keep it that way for now.
    const url = withBaseUrl('/api/profile');
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, {
        method: 'POST',
        headers,
        body: formData,
    });
}

/**
 * Analyzes a photo of products using the API.
 * @param {File} photo - The photo file to analyze.
 * @param {Biomarkers} labs - The user's biomarker data.
 * @param {Preferences} preferences - The user's preferences.
 * @returns {Promise<PhotoAnalysisResponse>}
 */
export const analyzePhoto = async (
    photo: File,
    labs: Biomarkers,
    preferences: Preferences
): Promise<PhotoAnalysisResponse> => {
    const formData = new FormData();
    formData.append('mode', 'photo');
    formData.append('photo', photo);
    formData.append('labs_json', JSON.stringify(labs));
    formData.append('preferences_json', JSON.stringify(preferences));
    
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers,
        body: formData,
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }
    
    return response.json();
}

export const generateRecipe = async (payload: {
    products: string[];
    difficulty: string;
    meal: string;
    context: { 
        labs: Biomarkers; 
        preferences: Preferences & { available: string[] } 
    };
}): Promise<PlanItem> => {
    
    const formData = new FormData();
    formData.append('mode', 'ai_recipe');
    formData.append('difficulty', payload.difficulty);
    formData.append('labs_json', JSON.stringify(payload.context.labs));
    formData.append('preferences_json', JSON.stringify({
        ...payload.context.preferences,
        available: payload.products
    }));


    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
};


// --- Auth API ---

export const registerUser = (userData: Omit<User, 'id'>) => {
    return postJsonAPI('/auth/register', userData);
}

export const loginUser = (credentials: FormData) => {
    const url = withBaseUrl('/auth/token');
    return fetch(url, {
        method: 'POST',
        body: credentials,
    });
}

export const fetchCurrentUser = (): Promise<User> => {
    return getAPI('/auth/users/me');
}


// --- Recipes API ---

/**
 * Creates a new recipe.
 */
export const createRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id'>): Promise<Recipe> => {
    const response = await postJsonAPI('/recipes/', recipeData);
    if (response.ok) {
        return response.data;
    } else {
        throw new Error(response.data.detail || 'Failed to create recipe');
    }
}

/**
 * Fetches all recipes for the current user.
 */
export const getRecipes = (): Promise<Recipe[]> => {
    return getAPI('/recipes/');
}

/**
 * Fetches a single recipe by its ID.
 */
export const getRecipeById = (recipeId: string): Promise<Recipe> => {
    return getAPI(`/recipes/${recipeId}`);
}

/**
 * Updates an existing recipe.
 */
export const updateRecipe = (recipeId: string, recipeData: Partial<Omit<Recipe, 'id' | 'user_id'>>): Promise<Recipe> => {
    return putJsonAPI(`/recipes/${recipeId}`, recipeData);
}

/**
 * Deletes a recipe by its ID.
 */
export const deleteRecipe = (recipeId: string): Promise<Response> => {
    return deleteAPI(`/recipes/${recipeId}`);
}
