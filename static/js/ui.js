import { TAG_NAMES, BIOMARKERS } from './constants.js';
import { state } from './state.js';

// --- Element References ---
let vitaminList, resultContainer, mealSlots, shoppingListContainer, aiGeneratorWizard, modalBody, modal, detectedItemsContainer, aiRecommendationsMessages, biomarkersGrid, allergiesContainer, allergiesInput;

/**
 * Initializes the UI module with necessary DOM element references.
 * This should be called once after the DOM is fully loaded.
 */
export function initUI() {
    vitaminList = document.getElementById('vitaminList');
    resultContainer = document.querySelector('.results-grid-diy');
    mealSlots = {
        breakfast: document.getElementById('breakfast-slot-content'),
        lunch: document.getElementById('lunch-slot-content'),
        dinner: document.getElementById('dinner-slot-content'),
    };
    shoppingListContainer = document.getElementById('shopping-list');
    aiGeneratorWizard = document.getElementById('ai-generator-wizard');
    modalBody = document.getElementById('modal-body');
    modal = document.getElementById('recipe-modal');
    detectedItemsContainer = document.getElementById('detected-items-container');
    aiRecommendationsMessages = document.getElementById('ai-recommendations-messages');
    biomarkersGrid = document.getElementById('biomarkers-grid');
    allergiesContainer = document.getElementById('allergies-container');
    allergiesInput = document.getElementById('allergies-input');
}

/**
 * Renders the AI recipe generation wizard and sets up its internal event listeners.
 */
export function createAIGeneratorWizard() {
  aiGeneratorWizard.innerHTML = `
    <div class="ai-wizard-sidebar">
        <div class="wizard-step active" data-step="1">
            <div class="wizard-step-icon">1</div>
            <span class="wizard-step-label">Сложность</span>
        </div>
        <div class="wizard-step" data-step="2">
            <div class="wizard-step-icon">2</div>
            <span class="wizard-step-label">Генерация</span>
        </div>
    </div>
    <div class="ai-wizard-content">
        <div id="wizard-step-1-content">
            <h4>Какое блюдо вы хотите?</h4>
            <div class="options-grid">
                <button class="option-card" data-difficulty="лёгкий">
                    <span class="option-icon">🥗</span>
                    <h3>Лёгкий</h3>
                    <p>Быстрый и простой перекус или салат.</p>
                </button>
                <button class="option-card" data-difficulty="средний">
                    <span class="option-icon">🍲</span>
                    <h3>Средний</h3>
                    <p>Сбалансированное основное блюдо.</p>
                </button>
                <button class="option-card" data-difficulty="плотный">
                    <span class="option-icon">🥘</span>
                    <h3>Плотный</h3>
                    <p>Сытное и комплексное блюдо.</p>
                </button>
            </div>
        </div>
        <div id="wizard-step-2-content" class="hidden">
             <h4>Готово к генерации!</h4>
             <p>Мы используем ваши анализы, предпочтения и выбранные продукты для создания уникальных рецептов.</p>
             <button id="generate-ai-recipes-btn" class="btn-primary">Сгенерировать 3 рецепта</button>
             <div id="ai-recipes-container"></div>
        </div>
    </div>
  `;

  aiGeneratorWizard.classList.remove('hidden');

  aiGeneratorWizard.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
          state.currentAIGeneration.difficulty = card.dataset.difficulty;
          
          document.getElementById('wizard-step-1-content').classList.add('hidden');
          document.getElementById('wizard-step-2-content').classList.remove('hidden');
          aiGeneratorWizard.querySelector('.wizard-step[data-step="1"]').classList.remove('active');
          aiGeneratorWizard.querySelector('.wizard-step[data-step="2"]').classList.add('active');
          
          aiGeneratorWizard.querySelector('.ai-wizard-sidebar').classList.add('collapsed');
      });
  });
  
  document.getElementById('generate-ai-recipes-btn').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('generate-ai-recipes'));
  });
}

/**
 * Renders the generated AI recipes into their container.
 */
export function renderAIRecipes() {
    const container = document.getElementById('ai-recipes-container');
    container.innerHTML = ''; // Clear and re-render all
    state.currentAIGeneration.recipes.forEach(recipe => {
        const card = createResultCard(recipe, 'diy');
        container.appendChild(card);
    });
}

/**
 * Populates the biomarkers grid with input fields.
 */
export function initBiomarkers() {
  Object.entries(BIOMARKERS).forEach(([key, { name, unit, default: defaultValue, description, range, inverse }]) => {
    const biomarkerEl = document.createElement('div');
    biomarkerEl.className = 'biomarker-item';

    const nameHtml = description ?
      `<span class="tooltip-trigger">${name}<span class="tooltip">${description}</span></span>` :
      name;

    biomarkerEl.innerHTML = `
      <label for="${key}">${nameHtml}</label>
      <div class="input-wrapper">
        <input type="number" id="${key}" name="${key}" placeholder="${defaultValue}" step="0.1" />
        <span class="unit">${unit}</span>
      </div>
    `;
    biomarkersGrid.appendChild(biomarkerEl);
    const input = biomarkerEl.querySelector('input');

    input.addEventListener('input', () => {
      if (input.value) {
        state.biomarkers[key] = parseFloat(input.value);
        if(range) {
            updateInputStatus(input, range, inverse);
        }
      } else {
        delete state.biomarkers[key];
        input.parentElement.classList.remove('status-ok', 'status-warning', 'status-danger');
      }
    });
  });
}

/**
 * Updates the visual status of a biomarker input based on its value.
 * @param {HTMLInputElement} inputEl The input element.
 * @param {number[]} range The range array [ok, warning, danger].
 * @param {boolean} inverse If true, higher values are worse.
 */
function updateInputStatus(inputEl, range, inverse = false) {
    const value = parseFloat(inputEl.value);
    const wrapper = inputEl.parentElement;

    wrapper.classList.remove('status-ok', 'status-warning', 'status-danger');

    if (isNaN(value)) return;

    const [ok, warning, danger] = range;
    let status = '';

    if (inverse) { // Higher is worse
        if (value >= danger) status = 'status-danger';
        else if (value >= warning) status = 'status-warning';
        else if (value < ok) status = 'status-ok'; // Optimal is below the 'ok' threshold
        else status = 'status-warning'; // Between ok and warning
    } else { // Lower is worse
        if (value >= ok) status = 'status-ok';
        else if (value >= warning) status = 'status-warning';
        else status = 'status-danger';
    }
    
    if (status) {
        wrapper.classList.add(status);
    }
}


/**
 * Sets up the tag input functionality for allergies.
 * @param {string[]} initialTags - An array of initial tags.
 * @param {function(string[]): void} onChange - Callback function that fires when tags change.
 * @returns {function(): string[]} A function that returns the current list of tags.
 */
export function setupTagsInput(initialTags = [], onChange = () => {}) {
  let tags = [...initialTags];

  function renderTags() {
    // Remove all but the input
    allergiesContainer.querySelectorAll('.tag').forEach(tagEl => tagEl.remove());

    tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.innerHTML = `
        ${tag}
        <button type="button" class="remove-tag">&times;</button>
      `;
      tagEl.querySelector('.remove-tag').addEventListener('click', () => {
        tags = tags.filter(t => t !== tag);
        renderTags();
        onChange(tags); // Fire callback
      });
      allergiesContainer.insertBefore(tagEl, allergiesInput);
    });
  }

  allergiesInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = allergiesInput.value.trim();
      if (newTag && !tags.includes(newTag)) {
        tags.push(newTag);
        allergiesInput.value = '';
        renderTags();
        onChange(tags); // Fire callback
      }
    }
  });

  renderTags(); // Initial render
  return () => tags; // Return a function to get current tags
}

/**
 * Programmatically sets the tags in the allergies input.
 * @param {string[]} newTags - The array of tags to set.
 */
export function setTags(newTags) {
    // This is a bit of a hack, as setupTagsInput holds the state.
    // For a more robust solution, the state should be managed outside.
    if (allergiesContainer) {
        allergiesInput.value = '';
        const tagElements = allergiesContainer.querySelectorAll('.tag');
        tagElements.forEach(el => el.remove());
        
        newTags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.innerHTML = `${tag} <button type="button" class="remove-tag">&times;</button>`;
            allergiesContainer.insertBefore(tagEl, allergiesInput);
        });
        // The internal 'tags' array in setupTagsInput will be out of sync
        // until the next interaction. This is a limitation of the current structure.
    }
}

/**
 * Renders the list of recommended vitamins.
 * @param {Array} vitamins - An array of vitamin recommendation objects.
 */
export function renderVitamins(vitamins) {
    vitaminList.innerHTML = '';
    if (vitamins && vitamins.length > 0) {
        const ul = document.createElement('ul');
        vitamins.forEach(rec => {
            if (rec.disclaimer) return; // Skip disclaimer entry
            const li = document.createElement('li');
            li.innerHTML = `<strong>${rec.name}</strong> - ${rec.dose} <em>(${rec.note})</em>`;
            ul.appendChild(li);
        });
        vitaminList.appendChild(ul);
        vitaminList.classList.remove('text-muted');
    } else {
        vitaminList.textContent = 'На основе ваших анализов специфические добавки не требуются.';
    }
}

/**
 * Renders the results (recipes or restaurants) in the generator section.
 * @param {Array} results - The array of items to render.
 * @param {string} mode - The mode ('diy' or 'restaurants').
 */
export function renderResults(results, mode) {
    resultContainer.innerHTML = '';

    if (mode === 'diy') {
        const aiCard = createAICard();
        resultContainer.appendChild(aiCard);
    }

    if (results && results.length > 0) {
        results.forEach(item => {
            const card = createResultCard(item, mode);
            resultContainer.appendChild(card);
        });
    } else {
        resultContainer.innerHTML = `<p>К сожалению, по вашему запросу ничего не найдено.</p>`;
    }
}


function createAICard() {
      const card = document.createElement('div');
      card.className = 'result-card ai-card';
      card.innerHTML = `
          <div class="ai-card-inner">
              <div class="ai-card-content">
                  <div class="ai-card-header">
                      <span class="ai-icon">✨</span>
                      <h4>Сгенерировать с AI</h4>
                  </div>
                  <p>Создайте уникальный рецепт на основе ваших анализов, предпочтений и имеющихся продуктов.</p>
              </div>
              <div class="ai-card-footer">
                  <button class="btn-primary">Начать</button>
              </div>
          </div>
      `;
      card.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('open-ai-photo-modal'));
      });
      return card;
}


function createResultCard(item, mode) {
    const card = document.createElement('div');
    card.className = 'result-card';
    const isRestaurant = mode === 'restaurants';

    const name = isRestaurant ? item.dish : item.name;
    const description = isRestaurant ? `${item.score}` : item.time_min;
    const image = document.createElement('img');
    image.className = 'result-card-image';
    image.src = `https://placehold.co/110x88?text=${encodeURIComponent(name)}`;
    image.alt = name;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'result-card-content';

    if (isRestaurant) {
        contentDiv.innerHTML = `
        <div class="result-card-header">
          <h4>${name}</h4>
          <span class="distance">${item.distance_km.toFixed(1)} км</span>
        </div>
        <div class="result-card-footer">
          <p class="result-card-description">Оценка: ${description} ⭐️</p>
          <span class="restaurant-name">${item.restaurant}</span>
        </div>
      `;
    } else {
        const tagsHTML = item.tags && Array.isArray(item.tags) ?
            `<div class="result-card-tags">
            ${item.tags.map(tag => {
              const tagName = TAG_NAMES[tag] || tag;
              return `<span class="result-card-tag" data-tag="${tag}">${tagName}</span>`;
            }).join('')}
          </div>` :
            '';

        contentDiv.innerHTML = `
        <div class="result-card-header">
          <h4>${name}</h4>
        </div>
        <p class="result-card-description"><i>~${description} мин.</i></p>
        ${tagsHTML}
      `;
    }

    card.appendChild(contentDiv);

    const addButton = document.createElement('button');
    addButton.className = 'add-to-plan-btn';
    addButton.textContent = 'Добавить в план';
    addButton.onclick = () => {
        document.dispatchEvent(new CustomEvent('add-to-plan', { detail: { item, mode } }));
    };

    const rightCol = document.createElement('div');
    rightCol.className = 'result-card-right-col';
    rightCol.appendChild(image);
    rightCol.appendChild(addButton);

    card.appendChild(rightCol);
    return card;
}

/**
 * Renders the daily meal plan.
 */
export function renderPlan() {
    Object.entries(state.plan).forEach(([meal, item]) => {
        const slot = mealSlots[meal];
        slot.innerHTML = '';
        if (item) {
            const card = createPlanCard(item, meal);
            slot.appendChild(card);
        } else {
            slot.innerHTML = `<div class="empty-meal-slot">Нажмите "+", чтобы подобрать блюдо</div>`;
        }
    });
}

function createPlanCard(item, meal) {
    const card = document.createElement('div');
    card.className = 'result-card compact';
    const isRestaurant = item.mode === 'restaurants';

    const name = isRestaurant ? item.dish : item.name;
    const description = isRestaurant ? `<b>${item.restaurant}</b> ${item.distance_km.toFixed(1)} км` : `~${item.time_min} мин.`;

    card.innerHTML = `
    <div class="result-card-content">
      <div class="result-card-header">
        <h4>${name}</h4>
      </div>
      <p class="result-card-description">${description}</p>
    </div>
    `;

    if (!isRestaurant) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => showRecipeModal(item));
    }

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-from-plan-btn';
    removeButton.innerHTML = '&times;';
    removeButton.title = 'Удалить из плана';
    removeButton.onclick = (e) => {
        e.stopPropagation();
        document.dispatchEvent(new CustomEvent('remove-from-plan', { detail: { meal } }));
    };

    card.appendChild(removeButton);
    return card;
}


function parseAmount(amountStr) {
    if (!amountStr || typeof amountStr !== 'string') {
        return { value: 1, unit: '' };
    }
    amountStr = amountStr.trim();

    let match = amountStr.match(/^(\d+)\/(\d+)\s*(.*)$/);
    if (match) {
        const value = parseInt(match[1], 10) / parseInt(match[2], 10);
        return { value: value, unit: match[3].trim() };
    }
    match = amountStr.match(/^([\d\.]+)\s*(.*)$/);
    if (match) {
        return { value: parseFloat(match[1]), unit: match[2].trim() };
    }
    return { value: 1, unit: amountStr };
}

function getPluralizedUnit(value, unit) {
    const rules = new Intl.PluralRules('ru-RU');
    const category = rules.select(value);

    const pluralForms = {
        'щепотка': { one: 'щепотка', few: 'щепотки', many: 'щепоток' },
    };

    if (pluralForms[unit]) {
        return pluralForms[unit][category] || pluralForms[unit].many;
    }

    return unit;
}

/**
 * Updates the shopping list based on the current meal plan.
 */
export function updateShoppingList() {
    shoppingListContainer.innerHTML = '';
    const ingredientsTotals = new Map();

    Object.values(state.plan).forEach(item => {
        if (item && item.mode === 'diy' && Array.isArray(item.ingredients)) {
            item.ingredients.forEach(ingredient => {
                if (!ingredientsTotals.has(ingredient.name)) {
                    ingredientsTotals.set(ingredient.name, {});
                }
                const totals = ingredientsTotals.get(ingredient.name);
                const { value, unit } = parseAmount(ingredient.amount);

                if (totals[unit]) {
                    totals[unit] += value;
                } else {
                    totals[unit] = value;
                }
            });
        }
    });

    if (ingredientsTotals.size > 0) {
        const ul = document.createElement('ul');
        ul.className = 'shopping-list';
        const sortedIngredients = [...ingredientsTotals.entries()].sort((a, b) => a[0].localeCompare(b[0]));

        for (const [name, totals] of sortedIngredients) {
            const li = document.createElement('li');
            const amountsStr = Object.entries(totals)
                .map(([unit, value]) => `${value.toLocaleString('ru-RU')} ${getPluralizedUnit(value, unit)}`)
                .join(', ');

            li.innerHTML = `<span>${name}</span> <span class="amount">${amountsStr}</span>`;
            ul.appendChild(li);
        }
        shoppingListContainer.appendChild(ul);
    } else {
        shoppingListContainer.innerHTML = `
        <div class="empty-basket">
          <p>Добавьте рецепты в план, чтобы увидеть здесь список ингредиентов.</p>
        </div>`;
    }
}

/**
 * Shows the recipe modal with the details of a given recipe.
 * @param {object} recipe - The recipe object.
 */
export function showRecipeModal(recipe) {
    modalBody.innerHTML = `
        <h2 class="recipe-modal-title">${recipe.name}</h2>
        <p class="recipe-modal-description">${recipe.description}</p>
        
        <div class="recipe-modal-section">
            <h3>Ингредиенты</h3>
            <ul class="recipe-ingredients-list">
                ${recipe.ingredients.map(ing => `<li><span>${ing.name}</span><span class="amount">${ing.amount}</span></li>`).join('')}
            </ul>
        </div>

        <div class="recipe-modal-section">
            <h3>Инструкции</h3>
            <ol class="recipe-instructions-list">
                ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
    `;
    modal.classList.remove('hidden');
}

/**
 * Hides the recipe modal.
 */
export function hideRecipeModal() {
    modal.classList.add('hidden');
    modalBody.innerHTML = '';
}


/**
 * Renders the items detected in the uploaded photo.
 */
export function renderDetectedItems() {
    detectedItemsContainer.innerHTML = '';
    state.detectedPhotoItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'detected-item';
        itemEl.textContent = item;
        itemEl.dataset.item = item;
        itemEl.addEventListener('click', () => {
            itemEl.classList.toggle('removed');
        });
        detectedItemsContainer.appendChild(itemEl);
    });
}

/**
 * Renders the messages in the AI recommendations chat.
 */
export function renderRecChatMessages() {
    aiRecommendationsMessages.innerHTML = '';
    state.recommendationsChat.history.forEach(msg => {
        const messageHtml = getChatMessageHTML(msg.content, msg.role);
        aiRecommendationsMessages.insertAdjacentHTML('beforeend', messageHtml);
    });
    aiRecommendationsMessages.scrollTop = aiRecommendationsMessages.scrollHeight;
}


function getChatMessageHTML(content, role) {
    return `
    <div class="chat-message ${role}">
      <div class="chat-bubble">
        <p>${content.replace(/\n/g, '<br>')}</p>
      </div>
    </div>
  `;
} 