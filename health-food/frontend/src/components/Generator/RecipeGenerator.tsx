import { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRecommendations, setCurrentMeal, setGeneratorMode, setPlanItem } from '../../store/slices/appSlice';
import type { PlanItem } from '../../store/slices/appSlice';
import RecipeCard from '../UI/RecipeCard';
import { AICard } from './AICard';
import MyRecipesModal from './MyRecipesModal';

const RecipeGenerator = () => {
    const dispatch = useAppDispatch();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isRecipesModalOpen, setRecipesModalOpen] = useState(false);

    const currentMeal = useAppSelector(state => state.app.currentMeal);
    const { mode, isLoading, results, error } = useAppSelector(state => state.app.generator);
    
    useEffect(() => {
        if (currentMeal && containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentMeal]);

    const mealNameMap = {
        breakfast: 'завтрак',
        lunch: 'обед',
        dinner: 'ужин',
    };

    const handleClose = () => {
        dispatch(setCurrentMeal(null));
    };

    const handleModeSelect = (selectedMode: 'diy' | 'restaurants') => {
        dispatch(setGeneratorMode(selectedMode));
        dispatch(fetchRecommendations(selectedMode));
    };

    const handleAddToPlan = (item: PlanItem) => {
        if(currentMeal && mode) {
            dispatch(setPlanItem({ meal: currentMeal, item, mode }));
            handleClose();
        }
    }

    if (!currentMeal) {
        return null;
    }

    return (
        <>
            <div className="step-card" id="generator-section" ref={containerRef}>
                <div className="step-header">
                    <div className="step-number" id="generator-icon">🧑‍🍳</div>
                    <div className="step-info">
                        <h2 id="generator-title">Подбор блюд на {mealNameMap[currentMeal]}</h2>
                        <p>Выберите, хотите ли вы готовить сами или найти подходящие блюда в заведениях поблизости.</p>
                    </div>
                    <button className="close-btn" id="close-generator-btn" title="Закрыть подбор" onClick={handleClose}>&times;</button>
                </div>
                <div className="options-grid">
                    <button className={`option-card ${mode === 'diy' ? 'primary' : ''}`} onClick={() => handleModeSelect('diy')}>
                        <span className="option-icon">🧑‍🍳</span>
                        <div className="option-content">
                            <h3>Сделать самому</h3>
                            <p>Получите персональные рецепты с пошаговыми инструкциями.</p>
                        </div>
                    </button>
                    <button className="option-card" onClick={() => setRecipesModalOpen(true)}>
                        <span className="option-icon">🥡</span>
                        <div className="option-content">
                            <h3>Мои рецепты</h3>
                            <p>Посмотреть сохраненные рецепты.</p>
                        </div>
                    </button>
                </div>
                
                <div className="results-section" id="resultsWrap">
                    {isLoading && <div className="loader"></div>}
                    {error && <p className="error">{error}</p>}
                    {!isLoading && !error && (
                        <div id="result" className="results-grid-diy">
                            {mode === 'diy' && <AICard />}
                            {results.length === 0 && !mode ? (
                                 <div className="empty-state">
                                    <span className="empty-icon">🍽️</span>
                                    <p>Выберите опцию, чтобы увидеть рекомендации.</p>
                                </div>
                            ) : results.map((item, index) => (
                                <RecipeCard key={index} item={item} onAddToPlan={handleAddToPlan} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <MyRecipesModal isOpen={isRecipesModalOpen} onClose={() => setRecipesModalOpen(false)} />
        </>
    );
};

export default RecipeGenerator; 