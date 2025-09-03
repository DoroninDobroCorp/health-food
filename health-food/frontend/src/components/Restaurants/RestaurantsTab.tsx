import { useState } from 'react';
import RecipeCard from '../UI/RecipeCard';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRecommendations, setGeneratorMode, setPlanItem, type PlanItem } from '../../store/slices/appSlice';

const RestaurantsTab = () => {
    const dispatch = useAppDispatch();
    const { results, isLoading, error } = useAppSelector(state => state.app.generator);
    const currentMeal = useAppSelector(state => state.app.currentMeal);
    const [hasFetched, setHasFetched] = useState(false);

    const handleSearch = () => {
        dispatch(setGeneratorMode('restaurants'));
        dispatch(fetchRecommendations('restaurants'));
        setHasFetched(true);
    };

    const handleAddToPlan = (item: PlanItem) => {
        const meal: 'breakfast' | 'lunch' | 'dinner' = currentMeal ?? 'lunch';
        dispatch(setPlanItem({ meal, item, mode: 'restaurants' }));
    };

    return (
        <div className="content-wrapper">
            <div className="step-card">
                <div className="step-header">
                    <div className="step-number">📍</div>
                    <div className="step-info">
                        <h2>Заведения рядом</h2>
                        <p>Подберите подходящие блюда поблизости на основе ваших анализов. Приложение запросит доступ к геолокации, при отказе будет использована ближайшая крупная локация.</p>
                    </div>
                </div>

                <div className="actions-row">
                    <button className="btn-primary" onClick={handleSearch}>Найти рядом</button>
                    <button className="btn-secondary" onClick={handleSearch}>Обновить</button>
                </div>

                <div className="results-section">
                    {isLoading && <div className="loader"></div>}
                    {error && <p className="error">{error}</p>}
                    {!isLoading && !error && (
                        results.length > 0 ? (
                            <div className="results-grid-diy">
                                {results.map((item, idx) => (
                                    <RecipeCard key={idx} item={item} onAddToPlan={handleAddToPlan} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <span className="empty-icon">🍽️</span>
                                <p>{hasFetched ? 'По вашему запросу ничего не найдено.' : 'Нажмите «Найти рядом», чтобы увидеть блюда.'}</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantsTab;
