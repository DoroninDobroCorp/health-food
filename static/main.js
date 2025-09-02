import { state } from './js/state.js';
import {
  generateAIrecipes,
  generatePlan,
  analyzePhoto,
  saveProfile,
  loadProfileData,
  saveLabs,
  loadRemindersData,
  getVitaminRecommendations
} from './js/api.js';

import {
  initUI,
  createAIGeneratorWizard,
  renderAIRecipes,
  renderVitamins,
  renderResults,
  renderPlan,
  updateShoppingList,
  hideRecipeModal,
  renderDetectedItems,
  renderRecChatMessages,
  initBiomarkers,
  setupTagsInput,
  setTags,
} from './js/ui.js';
import { saveData, loadData } from './js/storage.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selections ---
  const dietSelect = document.getElementById('diet-select');
  const mealSlots = {
    breakfast: document.getElementById('breakfast-slot-content'),
    lunch: document.getElementById('lunch-slot-content'),
    dinner: document.getElementById('dinner-slot-content'),
  };

  const generatorSection = document.getElementById('generator-section');
  const closeGeneratorBtn = document.getElementById('close-generator-btn');
  const generatorTitle = document.getElementById('generator-title');
  const resultContainer = document.querySelector('.results-grid-diy');
  const optionCards = document.querySelectorAll('.option-card');
  const geoBtn = document.getElementById('geoBtn');
  const locationSection = document.querySelector('.location-section');

  const clearPlanBtn = document.getElementById('clear-plan-btn');

  const modal = document.getElementById('recipe-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');

  const form = document.getElementById('genForm');
  const modeInput = document.getElementById('mode');
  const mealInput = document.getElementById('meal');
  const latInput = document.getElementById('lat');
  const lonInput = document.getElementById('lon');

  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // AI Photo Modal Elements
  const aiPhotoModal = document.getElementById('ai-photo-modal');
  const closeAIModalBtn = document.getElementById('close-ai-modal-btn');
  const imageUploadArea = document.getElementById('image-upload-area');
  const photoUploadInput = document.getElementById('photo-upload-input');
  const imagePreviewArea = document.getElementById('image-preview-area');
  const imagePreview = document.getElementById('image-preview');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const aiResultsArea = document.getElementById('ai-results-area');
  const detectedItemsContainer = document.getElementById('detected-items-container');
  const aiModalLoader = document.getElementById('ai-modal-loader');
  const analyzePhotoBtn = document.getElementById('analyze-photo-btn');
  const useProductsBtn = document.getElementById('use-products-btn');
  const aiGeneratorWizard = document.getElementById('ai-generator-wizard');


  // --- State & Data Persistence ---
  let getAllergies = () => [];
  let isRestoringState = false;

  function saveStateToStorage() {
    if (isRestoringState) return;
    const dataToSave = {
      biomarkers: getBiomarkersData(),
      preferences: {
        diet: dietSelect.value,
        allergies: getAllergies(),
      },
      plan: state.plan,
    };
    saveData(dataToSave);
  }

  function loadStateFromStorage() {
    const savedData = loadData();
    if (savedData) {
      isRestoringState = true;
      // Restore biomarkers
      if (savedData.biomarkers) {
        Object.entries(savedData.biomarkers).forEach(([key, value]) => {
          const input = document.getElementById(key);
          if (input) {
            input.value = value;
            // Trigger input event to update styling
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      }

      // Restore preferences
      if (savedData.preferences) {
        dietSelect.value = savedData.preferences.diet || '';
        // Re-initialize tags input with saved data
        getAllergies = setupTagsInput(savedData.preferences.allergies || [], saveStateToStorage);
      }

      // Restore plan
      if (savedData.plan) {
        state.plan = savedData.plan;
        renderPlan();
        updateShoppingList();
      }
      isRestoringState = false;
    } else {
        // If no saved data, just initialize the tags input
        getAllergies = setupTagsInput([], saveStateToStorage);
    }
  }


  // --- Initialize Modules ---
  initUI();
  initBiomarkers();


  // --- FUNCTIONS & LOGIC ---

  async function handleAIGeneration() {
      const btn = document.getElementById('generate-ai-recipes-btn');
      const container = document.getElementById('ai-recipes-container');

      if (state.currentAIGeneration.attempts >= 3) {
          return; // Max attempts reached
      }

      btn.disabled = true;
      container.innerHTML += '<div class="loader-wrapper"><div class="loader"></div><p>Магия уже происходит...</p></div>';

      const formData = new FormData();
      formData.append('mode', 'ai_recipe');
      formData.append('labs_json', JSON.stringify(getBiomarkersData()));
      
      const prefs = getPreferencesData();
      prefs.available = state.currentAIGeneration.availableProducts;
      formData.append('preferences_json', JSON.stringify(prefs));
      
      formData.append('difficulty', state.currentAIGeneration.difficulty);

      try {
        const data = await generateAIrecipes(formData);
        const newRecipes = data.recipes || [];

        state.currentAIGeneration.recipes.push(...newRecipes);
        state.currentAIGeneration.attempts++;
        
        renderAIRecipes();

      } catch (error) {
          console.error("Error generating AI recipes:", error);
          const errorEl = document.createElement('p');
          errorEl.className = 'error-message';
          errorEl.textContent = 'Произошла ошибка при генерации рецептов. Попробуйте еще раз.';
          container.appendChild(errorEl);
      } finally {
        const loader = container.querySelector('.loader-wrapper');
        if(loader) loader.remove();

        if (state.currentAIGeneration.attempts < 3) {
            btn.textContent = `Сгенерировать ещё (${3 - state.currentAIGeneration.attempts} попытки)`;
            btn.disabled = false;
        } else {
            btn.textContent = 'Достигнут лимит генераций';
            btn.disabled = true;
        }
      }
  }

  function getBiomarkersData() {
    const data = {};
    const inputs = document.querySelectorAll('#biomarkers-grid input');
    inputs.forEach(input => {
      if (input.value) {
        data[input.name] = parseFloat(input.value);
      }
    });
    return data;
  }

  function getPreferencesData() {
    const diet = dietSelect.value;
    const allergies = getAllergies();
    
    const prefs = {};
    if (diet) {
      prefs.diet = diet;
    }
    if (allergies.length > 0) {
      prefs.allergies = allergies;
    }
    return prefs;
  }

  function openGenerator(meal) {
    state.currentMeal = meal;
    mealInput.value = meal;

    const mealNameMap = {
      breakfast: 'завтрак',
      lunch: 'обед',
      dinner: 'ужин',
    };

    state.currentAIGeneration = {
        meal: meal,
        difficulty: null,
        availableProducts: [],
        attempts: 0,
        recipes: []
    };

    generatorTitle.textContent = `Подбор блюд на ${mealNameMap[meal]} `;
    generatorSection.classList.remove('hidden');

    aiGeneratorWizard.classList.add('hidden');
    aiGeneratorWizard.innerHTML = '';
    generatorSection.querySelector('.options-grid').classList.remove('hidden');
    resultContainer.classList.remove('hidden');
    optionCards.forEach(c => c.classList.remove('primary'));
    locationSection.classList.add('hidden');


    resultContainer.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🍽️</span>
        <p>Выберите опцию, чтобы увидеть рекомендации.</p>
      </div>`;
    generatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeGenerator() {
    state.currentMeal = null;
    generatorSection.classList.add('hidden');
  }

  async function generate() {
    if (!state.currentMeal) return;

    resultContainer.innerHTML = '<div class="loader"></div>';

    const formData = new FormData();
    formData.append('mode', modeInput.value);
    formData.append('labs_json', JSON.stringify(getBiomarkersData()));
    formData.append('preferences_json', JSON.stringify(getPreferencesData()));

    if (latInput.value && lonInput.value) {
      formData.append('lat', latInput.value);
      formData.append('lon', lonInput.value);
    }

    try {
      const data = await generatePlan(formData);

      if (modeInput.value === 'diy') {
        renderResults(data.plan, 'diy');
      } else if (modeInput.value === 'restaurants') {
        renderResults(data.restaurants, 'restaurants');
      }

    } catch (error) {
      console.error('Error generating results:', error);
      resultContainer.innerHTML = `<p class="error">Произошла ошибка при генерации. Попробуйте еще раз.</p>`;
    }
  }

  function addToPlan(item, mode) {
    const meal = state.currentMeal;
    if (!meal) return;
    const planItem = { ...item, mode };

    state.plan[meal] = planItem;
    renderPlan();
    updateShoppingList();
    closeGenerator();
    saveStateToStorage();
  }

  function removeFromPlan(meal) {
    state.plan[meal] = null;
    renderPlan();
    updateShoppingList();
    saveStateToStorage();
  }

  async function loadProfile() {
    try {
      const data = await loadProfileData();
      document.getElementById('prof_name').value = data.name || '';
      document.getElementById('prof_email').value = data.email || '';
      document.getElementById('prof_goals').value = data.goals || '';
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  async function loadReminders() {
    const remindersList = document.getElementById('reminders');
    remindersList.innerHTML = '<div class="loader"></div>';
    try {
      const data = await loadRemindersData();
      remindersList.innerHTML = '';
      if (data.items && data.items.length > 0) {
        const ul = document.createElement('ul');
        data.items.forEach(rem => {
          const li = document.createElement('li');
          li.className = 'reminder-item';
          const reminderDate = new Date(rem.due_at).toLocaleDateString('ru-RU');
          li.innerHTML = `<span>Напоминание о сдаче анализов</span> <strong>${reminderDate}</strong>`;
          ul.appendChild(li);
        });
        remindersList.appendChild(ul);
      } else {
        remindersList.innerHTML = '<p>Активных напоминаний нет.</p>';
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      remindersList.innerHTML = '<p>Ошибка сети при загрузке напоминаний.</p>';
    }
  }

  function openAIPhotoModal() {
    resetAIModalState();
    aiPhotoModal.classList.remove('hidden');
  }

  function closeAIPhotoModal() {
    aiPhotoModal.classList.add('hidden');
  }

  function resetAIModalState() {
    photoUploadInput.value = ''; // Clear file input
    
    document.getElementById('ai-modal-initial-state').classList.remove('hidden');
    document.getElementById('ai-modal-preview-state').classList.add('hidden');
    document.getElementById('ai-modal-results-state').classList.add('hidden');

    imagePreview.src = '#';
    detectedItemsContainer.innerHTML = '';
    aiModalLoader.classList.add('hidden');

    analyzePhotoBtn.disabled = true;
    analyzePhotoBtn.classList.remove('hidden');
    useProductsBtn.classList.add('hidden');
    state.detectedPhotoItems = [];
  }

  async function sendRecChatMessage(isInitial = false) {
    const message = isInitial ? "Привет! Можешь дать мне рекомендации по добавкам на основе моих анализов?" : recChatInput.value.trim();
    if (!message) return;

    state.recommendationsChat.history.push({ role: 'user', content: message });
    renderRecChatMessages();
    recChatInput.value = '';
    recChatInput.style.height = 'auto';
    
    const loaderId = 'rec-chat-loader-bubble';
    const loaderHtml = `
      <div class="chat-message assistant" id="${loaderId}">
        <div class="chat-bubble">
          <div class="loader"></div>
        </div>
      </div>`;
    document.getElementById('ai-recommendations-messages').insertAdjacentHTML('beforeend', loaderHtml);
    document.getElementById('ai-recommendations-messages').scrollTop = document.getElementById('ai-recommendations-messages').scrollHeight;
    
    try {
      const biomarkers = getBiomarkersData();
      const deficits = {}; 
      const preferences = {
        diet: document.getElementById('diet-select').value,
        allergies: getAllergies()
      };
      
      const data = await getVitaminRecommendations({
        message: message,
        thread_id: state.recommendationsChat.thread_id || null,
        context: {
          labs: biomarkers,
          deficits: deficits,
          preferences: preferences
        }
      });
      
      const loaderBubble = document.getElementById(loaderId);
      if (loaderBubble) {
        loaderBubble.remove();
      }
      
      state.recommendationsChat.thread_id = data.thread_id;
      
      state.recommendationsChat.history.push({ role: 'assistant', content: data.reply });
      renderRecChatMessages();
      
    } catch (error) {
      console.error('Error:', error);
      
      const loaderBubble = document.getElementById(loaderId);
      if (loaderBubble) {
        loaderBubble.remove();
      }
      
      const errorMessage = "Извините, произошла ошибка при получении рекомендаций. Пожалуйста, попробуйте позже.";
      state.recommendationsChat.history.push({ role: 'assistant', content: errorMessage });
      renderRecChatMessages();
    }
  }

  // --- Event Listeners ---
  document.querySelectorAll('.add-meal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const meal = e.target.dataset.mealButton;
      openGenerator(meal);
    });
  });

  closeGeneratorBtn.addEventListener('click', closeGenerator);

  optionCards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('disabled')) return;

      const currentMode = card.dataset.mode;
      modeInput.value = currentMode;

      optionCards.forEach(c => c.classList.remove('primary'));
      card.classList.add('primary');

      locationSection.classList.toggle('hidden', currentMode !== 'restaurants');

      resultContainer.innerHTML = '';

      if (currentMode === 'restaurants' && (!latInput.value || !lonInput.value)) {
        resultContainer.innerHTML = `
          <div class="empty-state">
             <span class="empty-icon">📍</span>
            <p>Пожалуйста, предоставьте геолокацию для поиска ресторанов.</p>
          </div>`;
        return;
      }

      generate();
    });
  });

  clearPlanBtn.addEventListener('click', () => {
    state.plan = { breakfast: null, lunch: null, dinner: null };
    renderPlan();
    updateShoppingList();
    saveStateToStorage();
  });

  closeModalBtn.addEventListener('click', hideRecipeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideRecipeModal();
    }
  });


  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Геолокация недоступна в вашем браузере');
      return;
    }
    resultContainer.innerHTML = '<div class="loader">Определяем ваше местоположение...</div>';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        latInput.value = position.coords.latitude;
        lonInput.value = position.coords.longitude;
        geoBtn.textContent = '📍 Ваше местоположение определено';
        geoBtn.disabled = true;
        if (modeInput.value === 'restaurants') {
          generate();
        }
      },
      (error) => {
        console.error('Error getting geolocation:', error);
        geoBtn.textContent = 'Не удалось определить местоположение';
      }
    );
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = document.querySelector(tab.dataset.tab);

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
  
  photoUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        document.getElementById('ai-modal-initial-state').classList.add('hidden');
        document.getElementById('ai-modal-preview-state').classList.remove('hidden');
        analyzePhotoBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }
  });

  removeImageBtn.addEventListener('click', () => {
    resetAIModalState();
  });

  analyzePhotoBtn.addEventListener('click', async () => {
    const file = photoUploadInput.files[0];
    if (!file) {
        alert('Пожалуйста, выберите файл для анализа.');
        return;
    }

    aiModalLoader.classList.remove('hidden');
    analyzePhotoBtn.disabled = true;
    imagePreviewArea.style.opacity = '0.5';

    const formData = new FormData();
    formData.append('mode', 'photo');
    formData.append('labs_json', JSON.stringify(getBiomarkersData()));
    formData.append('preferences_json', JSON.stringify(getPreferencesData()));
    formData.append('photo', file);

    try {
        const data = await analyzePhoto(formData);
        state.detectedPhotoItems = data.detected || [];
        renderDetectedItems();
        
        document.getElementById('ai-modal-preview-state').classList.add('hidden');
        document.getElementById('ai-modal-results-state').classList.remove('hidden');

        analyzePhotoBtn.classList.add('hidden');
        useProductsBtn.classList.remove('hidden');

    } catch (error) {
        console.error('Error analyzing photo:', error);
        alert(`Произошла ошибка: ${error.message}`);
    } finally {
        aiModalLoader.classList.add('hidden');
        analyzePhotoBtn.disabled = false;
        imagePreviewArea.style.opacity = '1';
    }
  });

  useProductsBtn.addEventListener('click', () => {
      const finalItems = Array.from(detectedItemsContainer.querySelectorAll('.detected-item:not(.removed)'))
          .map(el => el.dataset.item);

      const currentPrefs = getPreferencesData();
      currentPrefs.available = finalItems;

      state.currentAIGeneration.availableProducts = finalItems;
      
      closeAIPhotoModal();
      
      generatorSection.querySelector('.options-grid').classList.add('hidden');
      resultContainer.classList.add('hidden');
      generatorTitle.textContent = `AI Генератор рецептов`;
      
      createAIGeneratorWizard();
  });

  closeAIModalBtn.addEventListener('click', closeAIPhotoModal);
  aiPhotoModal.addEventListener('click', (e) => {
    if (e.target === aiPhotoModal) {
      closeAIPhotoModal();
    }
  });

  const profileForm = document.getElementById('profileForm');
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(profileForm);

    try {
      const response = await saveProfile(formData);
      if (response.ok) {
        alert('Профиль сохранен!');
      } else {
        alert('Ошибка при сохранении профиля.');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Ошибка сети при сохранении профиля.');
    }
  });

  const saveLabsBtn = document.getElementById('saveLabsBtn');
  const weeksInput = document.getElementById('weeks');

  saveLabsBtn.addEventListener('click', async () => {
    const biomarkers = getBiomarkersData();
    const weeks = parseInt(weeksInput.value, 10);

    if (Object.keys(biomarkers).length === 0) {
      alert('Пожалуйста, введите данные анализов.');
      return;
    }
    if (isNaN(weeks) || weeks < 1) {
      alert('Пожалуйста, введите корректное количество недель.');
      return;
    }

    const formData = new FormData();
    formData.append('labs_json', JSON.stringify(biomarkers));
    formData.append('weeks', weeks);

    try {
      const response = await saveLabs(formData);
      if (response.ok) {
        alert('Анализы сохранены и напоминание установлено!');
        loadReminders();
      } else {
        alert('Не удалось сохранить анализы.');
      }
    } catch (error) {
      console.error('Error saving labs:', error);
      alert('Ошибка сети при сохранении.');
    }
  });

  const refreshRemBtn = document.getElementById('refreshRemBtn');
  refreshRemBtn.addEventListener('click', loadReminders);

  const getAIRecommendationsBtn = document.getElementById('get-ai-recommendations-btn');
  const aiRecommendationsChat = document.getElementById('ai-recommendations-chat');
  const recChatFooter = document.getElementById('rec-chat-footer');
  const recChatInput = document.getElementById('rec-chat-input');
  const recChatSendBtn = document.getElementById('rec-chat-send-btn');

  if (getAIRecommendationsBtn) {
    getAIRecommendationsBtn.addEventListener('click', async () => {
      const biomarkers = getBiomarkersData();
      
      if (Object.keys(biomarkers).length === 0) {
        alert('Пожалуйста, заполните хотя бы одно поле в разделе "Ваши анализы", чтобы получить рекомендации.');
        return;
      }
      
      document.getElementById('vitaminList').classList.add('hidden');
      aiRecommendationsChat.classList.remove('hidden');
      recChatFooter.classList.remove('hidden');
      
      sendRecChatMessage(true);
    });
  }

  recChatSendBtn.addEventListener('click', () => sendRecChatMessage(false));
  recChatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendRecChatMessage(false);
    }
  });
  recChatInput.addEventListener('input', () => {
      recChatInput.style.height = 'auto';
      recChatInput.style.height = (recChatInput.scrollHeight) + 'px';
  });

  // Attach listeners for auto-saving form data
  document.getElementById('biomarkers-grid').addEventListener('input', saveStateToStorage);
  dietSelect.addEventListener('change', saveStateToStorage);


  // --- Initial Load ---
  loadProfile();
  loadReminders();
  loadStateFromStorage();


  // --- Custom Event Listeners ---
  document.addEventListener('open-ai-photo-modal', openAIPhotoModal);
  document.addEventListener('add-to-plan', e => addToPlan(e.detail.item, e.detail.mode));
  document.addEventListener('remove-from-plan', e => removeFromPlan(e.detail.meal));
  document.addEventListener('generate-ai-recipes', handleAIGeneration);
});

