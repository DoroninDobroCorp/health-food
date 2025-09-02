export const state = {
  biomarkers: {},
  preferences: {},
  plan: {
    breakfast: null,
    lunch: null,
    dinner: null,
  },
  currentMeal: null, // 'breakfast', 'lunch', or 'dinner'
  detectedPhotoItems: [],
  recommendationsChat: {
    history: [],
    thread_id: null,
    isLoading: false,
  },
  currentAIGeneration: {
      meal: null,
      difficulty: null,
      availableProducts: [],
      attempts: 0,
      recipes: []
  }
}; 