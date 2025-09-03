import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { 
    generatePlan, 
    getVitaminRecommendations as fetchVitaminRecs, 
    loadRemindersData, 
    saveLabs as saveLabsAPI,
    loadProfileData,
    saveProfile as saveProfileAPI,
    generateRecipe as generateRecipeAPI,
    fetchCurrentUser as fetchCurrentUserAPI,
    getRecipes as getRecipesAPI,
    createRecipe as createRecipeAPI,
    updateRecipe as updateRecipeAPI,
    deleteRecipe as deleteRecipeAPI,
} from '../../api';
import { removeToken } from '../../store/localStorage';
import type { RootState } from '..';
import type {
    Biomarkers,
    Preferences,
    User,
    Recipe,
} from '../../api/types';

// Define types for your state
export interface PlanItem {
  // Define what a plan item looks like based on your old state
  [key: string]: any;
}

interface RecipesState {
    items: Recipe[];
    isLoading: boolean;
    error: string | null;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ProfileState {
    username: string;
    email: string;
    goals: string;
    isLoading: boolean;
    error: string | null;
}

interface VitaminChatState {
    history: Message[];
    thread_id: string | null;
    isLoading: boolean;
}

interface GeneratorState {
    mode: 'diy' | 'restaurants' | null;
    isLoading: boolean;
    results: PlanItem[];
    error: string | null;
}

interface Reminder {
    due_at: string;
    // Add other properties if they exist
}

interface RemindersState {
    items: Reminder[];
    isLoading: boolean;
    error: string | null;
}

interface AppState {
    biomarkers: Biomarkers;
    preferences: Preferences;
    plan: {
        breakfast: PlanItem | null;
        lunch: PlanItem | null;
        dinner: PlanItem | null;
    };
    currentMeal: 'breakfast' | 'lunch' | 'dinner' | null;
    generator: GeneratorState;
    vitaminChat: VitaminChatState;
    reminders: RemindersState;
    profile: ProfileState;
    isRecipeModalOpen: boolean;
    selectedRecipe: PlanItem | null;
    isAIPhotoModalOpen: boolean;
    lastDetectedProducts: string[];
    aiGenerationStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    generatedRecipes: PlanItem[];
    startWithLastProducts: boolean;
    // Auth state
    isAuthenticated: boolean;
    currentUser: User | null;
    token: string | null;
    authStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    authError: string | null;
    recipes: RecipesState;
    // Add other state properties from your old `state.js` here
}

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const user = await fetchCurrentUserAPI();
            return user;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// --- Recipes Thunks ---

export const fetchRecipes = createAsyncThunk(
    'recipes/fetchRecipes',
    async (_, { rejectWithValue }) => {
        try {
            const recipes = await getRecipesAPI();
            return recipes;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const createRecipe = createAsyncThunk(
    'recipes/createRecipe',
    async (recipeData: Omit<Recipe, 'id' | 'user_id'>, { dispatch, rejectWithValue }) => {
        try {
            const newRecipe = await createRecipeAPI(recipeData);
            dispatch(fetchRecipes()); // Refetch recipes to include the new one
            return newRecipe;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateRecipe = createAsyncThunk(
    'recipes/updateRecipe',
    async ({ recipeId, recipeData }: { recipeId: string, recipeData: Partial<Omit<Recipe, 'id' | 'user_id'>> }, { dispatch, rejectWithValue }) => {
        try {
            const updatedRecipe = await updateRecipeAPI(recipeId, recipeData);
            dispatch(fetchRecipes()); // Refetch recipes to reflect the update
            return updatedRecipe;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteRecipe = createAsyncThunk(
    'recipes/deleteRecipe',
    async (recipeId: string, { dispatch, rejectWithValue }) => {
        try {
            await deleteRecipeAPI(recipeId);
            dispatch(fetchRecipes()); // Refetch recipes to remove the deleted one
            return recipeId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);


export const fetchProfile = createAsyncThunk(
    'app/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            return await loadProfileData();
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const saveProfile = createAsyncThunk(
    'app/saveProfile',
    async (profileData: { name: string, email: string, goals: string }, { rejectWithValue }) => {
        const formData = new FormData();
        formData.append('name', profileData.name);
        formData.append('email', profileData.email);
        formData.append('goals', profileData.goals);
        try {
            const response = await saveProfileAPI(formData);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to save profile' }));
                return rejectWithValue(errorData.error);
            }
            return await response.json();
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const saveLabs = createAsyncThunk(
    'app/saveLabs',
    async ({ weeks, labsJson }: { weeks: number, labsJson: string }, { rejectWithValue }) => {
        const formData = new FormData();
        formData.append('weeks', String(weeks));
        formData.append('labs_json', labsJson);
        try {
            const response = await saveLabsAPI(formData);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to save labs' }));
                return rejectWithValue(errorData.error);
            }
            return await response.json();
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchReminders = createAsyncThunk(
    'app/fetchReminders',
    async (_, { rejectWithValue }) => {
        try {
            const data = await loadRemindersData();
            return data.items;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch reminders');
        }
    }
);

export const getVitaminRecommendations = createAsyncThunk(
    'app/getVitaminRecommendations',
    async (message: string, { getState, dispatch, rejectWithValue }) => {
        dispatch(addUserMessage(message));
        const state = getState() as RootState;
        const { biomarkers, preferences, vitaminChat } = state.app;

        const payload: { [key: string]: any } = {
            message,
            context: {
                labs: biomarkers,
                deficits: {}, // This was empty in the original code
                preferences: {
                    diet: preferences.diet,
                    allergies: preferences.allergies
                }
            }
        };

        if (vitaminChat.thread_id) {
            payload.thread_id = vitaminChat.thread_id;
        }

        try {
            const response = await fetchVitaminRecs(payload);
            if (!response.ok) {
                // Use the error message from the response data if available
                const errorMessage = response.data?.detail || 'Failed to fetch vitamin recommendations';
                return rejectWithValue(errorMessage);
            }
            return response.data; // Return the actual data on success
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch vitamin recommendations');
        }
    }
)

export const fetchRecommendations = createAsyncThunk(
    'app/fetchRecommendations',
    async (mode: 'diy' | 'restaurants', { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const { biomarkers, preferences } = state.app;

        const formData = new FormData();
        formData.append('mode', mode);
        
        // If restaurants mode, try to get user's current location (with safe fallback)
        if (mode === 'restaurants') {
            const fallback = { lat: 55.751244, lon: 37.618423 }; // Moscow center as fallback
            try {
                const coords = await new Promise<{ lat: number; lon: number }>((resolve) => {
                    if (typeof navigator === 'undefined' || !navigator.geolocation) {
                        resolve(fallback);
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                        () => resolve(fallback),
                        { enableHighAccuracy: true, timeout: 5000 }
                    );
                });
                formData.append('lat', String(coords.lat));
                formData.append('lon', String(coords.lon));
            } catch {
                formData.append('lat', String(fallback.lat));
                formData.append('lon', String(fallback.lon));
            }
        }
        formData.append('labs_json', JSON.stringify(biomarkers));
        formData.append('preferences_json', JSON.stringify(preferences));

        try {
            const data = await generatePlan(formData);
            return mode === 'diy' ? data.plan : data.restaurants;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch recommendations');
        }
    }
);

export const generateRecipe = createAsyncThunk(
    'app/generateRecipe',
    async (params: { products: string[], difficulty: 'легкий' | 'средний' | 'сложный' }, { getState, rejectWithValue }) => {
        const state = (getState() as RootState).app;
        const { biomarkers, preferences, currentMeal } = state;

        if (!currentMeal) {
            return rejectWithValue('No meal selected for generation');
        }

        try {
            const payload = {
                products: params.products,
                difficulty: params.difficulty,
                meal: currentMeal,
                context: {
                    labs: biomarkers,
                    preferences: {
                        ...preferences,
                        available: params.products
                    }
                }
            };
            const recipeData = await generateRecipeAPI(payload);
            return recipeData.recipes;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to generate recipe');
        }
    }
);


export const initialState: AppState = {
    biomarkers: {},
    preferences: {
        diet: '',
        allergies: [],
    },
    plan: {
        breakfast: null,
        lunch: null,
        dinner: null,
    },
    currentMeal: null,
    generator: {
        mode: null,
        isLoading: false,
        results: [],
        error: null,
    },
    vitaminChat: {
        history: [],
        thread_id: null,
        isLoading: false,
    },
    reminders: {
        items: [],
        isLoading: false,
        error: null,
    },
    profile: {
        username: '',
        email: '',
        goals: '',
        isLoading: false,
        error: null,
    },
    isRecipeModalOpen: false,
    selectedRecipe: null,
    isAIPhotoModalOpen: false,
    lastDetectedProducts: [],
    aiGenerationStatus: 'idle',
    generatedRecipes: [],
    startWithLastProducts: false,
    // Auth initial state
    isAuthenticated: false,
    currentUser: null,
    token: null,
    authStatus: 'idle',
    authError: null,
    recipes: {
        items: [],
        isLoading: false,
        error: null,
    },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentMeal(state, action: PayloadAction<'breakfast' | 'lunch' | 'dinner' | null>) {
      state.currentMeal = action.payload;
      if (action.payload === null) {
          // Reset generator state when closing it
          state.generator = initialState.generator;
      }
    },
    setGeneratorMode(state, action: PayloadAction<'diy' | 'restaurants' | null>) {
        state.generator.mode = action.payload;
    },
    selectRecipe(state, action: PayloadAction<PlanItem>) {
        state.selectedRecipe = action.payload;
        state.isRecipeModalOpen = true;
    },
    closeRecipeModal(state) {
        state.isRecipeModalOpen = false;
        state.selectedRecipe = null;
    },
    addUserMessage(state, action: PayloadAction<string>) {
        state.vitaminChat.history.push({ role: 'user', content: action.payload });
    },
    setBiomarker(state, action: PayloadAction<{ key: string; value: number }>) {
      state.biomarkers[action.payload.key] = action.payload.value;
    },
    removeBiomarker(state, action: PayloadAction<string>) {
        delete state.biomarkers[action.payload];
    },
    setDiet(state, action: PayloadAction<string>) {
      state.preferences.diet = action.payload;
    },
    setAllergies(state, action: PayloadAction<string[]>) {
      state.preferences.allergies = action.payload;
    },
    setPlanItem(state, action: PayloadAction<{ meal: 'breakfast' | 'lunch' | 'dinner'; item: PlanItem; mode: 'diy' | 'restaurants' }>) {
      state.plan[action.payload.meal] = { ...action.payload.item, mode: action.payload.mode };
    },
    clearPlanItem(state, action: PayloadAction<'breakfast' | 'lunch' | 'dinner'>) {
      state.plan[action.payload] = null;
    },
    clearPlan(state) {
        state.plan = { breakfast: null, lunch: null, dinner: null };
    },
    setBiomarkers: (state, action: PayloadAction<Biomarkers>) => {
        state.biomarkers = action.payload;
    },
    setPreferences: (state, action: PayloadAction<Preferences>) => {
        state.preferences = action.payload;
    },
    setAIPhotoModalOpen: (state, action: PayloadAction<boolean>) => {
        state.isAIPhotoModalOpen = action.payload;
        if (!action.payload) {
            // Reset generation status when modal is closed
            state.aiGenerationStatus = 'idle';
            state.generatedRecipes = [];
            state.startWithLastProducts = false;
        }
    },
    setLastDetectedProducts: (state, action: PayloadAction<string[]>) => {
        state.lastDetectedProducts = action.payload;
    },
    startGenerationWithLastProducts: (state) => {
        if (state.lastDetectedProducts.length > 0) {
            state.startWithLastProducts = true;
            state.isAIPhotoModalOpen = true;
        }
    },
    setToken(state, action: PayloadAction<string>) {
        state.isAuthenticated = true;
        state.token = action.payload;
        state.authError = null;
        state.authStatus = 'succeeded';
    },
    logout(state) {
        state.isAuthenticated = false;
        state.currentUser = null;
        state.token = null;
        removeToken();
    }
  },
  extraReducers: (builder) => {
    builder
        // --- Auth Reducers ---
        .addCase(fetchCurrentUser.pending, (state) => {
            state.authStatus = 'loading';
        })
        .addCase(fetchCurrentUser.fulfilled, (state, action) => {
            state.authStatus = 'succeeded';
            state.isAuthenticated = true;
            state.currentUser = action.payload;
        })
        .addCase(fetchCurrentUser.rejected, (state, action) => {
            state.authStatus = 'failed';
            state.isAuthenticated = false;
            state.currentUser = null;
            state.token = null;
            removeToken();
            state.authError = action.payload as string;
        })
        // --- Recipes Reducers ---
        .addCase(fetchRecipes.pending, (state) => {
            state.recipes.isLoading = true;
            state.recipes.error = null;
        })
        .addCase(fetchRecipes.fulfilled, (state, action: PayloadAction<Recipe[]>) => {
            state.recipes.isLoading = false;
            state.recipes.items = action.payload;
        })
        .addCase(fetchRecipes.rejected, (state, action) => {
            state.recipes.isLoading = false;
            state.recipes.error = action.payload as string;
        })
        .addCase(createRecipe.pending, (state) => {
            state.recipes.isLoading = true; // Or a specific creating flag
        })
        .addCase(createRecipe.rejected, (state, action) => {
            // We can handle the loading state on a higher level or per action
            state.recipes.error = action.payload as string;
        })
        .addCase(updateRecipe.rejected, (state, action) => {
            state.recipes.error = action.payload as string;
        })
        .addCase(deleteRecipe.rejected, (state, action) => {
            state.recipes.error = action.payload as string;
        })
        // Fulfilled cases for create/update/delete are handled by refetching, so we just need to handle loading/error states.
        .addCase(fetchRecommendations.pending, (state) => {
            state.generator.isLoading = true;
            state.generator.error = null;
            state.generator.results = [];
        })
        .addCase(fetchRecommendations.fulfilled, (state, action: PayloadAction<PlanItem[]>) => {
            state.generator.isLoading = false;
            state.generator.results = action.payload;
        })
        .addCase(fetchRecommendations.rejected, (state, action) => {
            state.generator.isLoading = false;
            state.generator.error = action.payload as string;
        })
        .addCase(getVitaminRecommendations.pending, (state) => {
            state.vitaminChat.isLoading = true;
        })
        .addCase(getVitaminRecommendations.fulfilled, (state, action) => {
            state.vitaminChat.isLoading = false;
            state.vitaminChat.thread_id = action.payload.thread_id;
            state.vitaminChat.history.push({ role: 'assistant', content: action.payload.reply });
        })
        .addCase(getVitaminRecommendations.rejected, (state, action) => {
            state.vitaminChat.isLoading = false;
            const errorMessage = action.payload as string || "Извините, произошла ошибка при получении рекомендаций.";
            state.vitaminChat.history.push({ role: 'assistant', content: errorMessage });
        })
        .addCase(fetchReminders.pending, (state) => {
            state.reminders.isLoading = true;
            state.reminders.error = null;
        })
        .addCase(fetchReminders.fulfilled, (state, action: PayloadAction<Reminder[]>) => {
            state.reminders.isLoading = false;
            state.reminders.items = action.payload;
        })
        .addCase(fetchReminders.rejected, (state, action) => {
            state.reminders.isLoading = false;
            state.reminders.error = action.payload as string;
        })
        .addCase(saveLabs.fulfilled, () => {
            // Optionally, you can handle the success case, e.g., show a notification
            // Or trigger a refetch of reminders
        })
        .addCase(fetchProfile.pending, (state) => {
            state.profile.isLoading = true;
            state.profile.error = null;
        })
        .addCase(fetchProfile.fulfilled, (state, action) => {
            state.profile.isLoading = false;
            state.profile.username = action.payload.username || '';
            state.profile.email = action.payload.email || '';
            state.profile.goals = action.payload.goals || '';
        })
        .addCase(fetchProfile.rejected, (state, action) => {
            state.profile.isLoading = false;
            state.profile.error = action.payload as string;
        })
        .addCase(saveProfile.pending, (state) => {
            state.profile.isLoading = true;
        })
        .addCase(saveProfile.fulfilled, (state, action) => {
            state.profile.isLoading = false;
            state.profile.username = action.payload.username || '';
            state.profile.email = action.payload.email || '';
            state.profile.goals = action.payload.goals || '';
        })
        .addCase(saveProfile.rejected, (state, action) => {
            state.profile.isLoading = false;
            state.profile.error = action.payload as string;
        })
        .addCase(generateRecipe.pending, (state) => {
            state.aiGenerationStatus = 'loading';
            state.generatedRecipes = [];
        })
        .addCase(generateRecipe.fulfilled, (state, action: PayloadAction<PlanItem[]>) => {
            state.aiGenerationStatus = 'succeeded';
            state.generatedRecipes = action.payload;
        })
        .addCase(generateRecipe.rejected, (state) => {
            state.aiGenerationStatus = 'failed';
        });
  }
});

export const {
  setCurrentMeal,
  setGeneratorMode,
  selectRecipe,
  closeRecipeModal,
  addUserMessage,
  setBiomarker,
  removeBiomarker,
  setDiet,
  setAllergies,
  setPlanItem,
  clearPlanItem,
  clearPlan,
  setBiomarkers,
  setPreferences,
  setAIPhotoModalOpen,
  setLastDetectedProducts,
  startGenerationWithLastProducts,
  setToken,
  logout,
} = appSlice.actions;

export default appSlice.reducer;
