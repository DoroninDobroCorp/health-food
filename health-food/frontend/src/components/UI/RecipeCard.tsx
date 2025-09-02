import { TAG_NAMES } from "../../constants/biomarkers";
import type { PlanItem } from "../../store/slices/appSlice";
import { useAppDispatch } from "../../store/hooks";
import { selectRecipe } from "../../store/slices/appSlice";

interface RecipeCardProps {
    item: PlanItem;
    onAddToPlan: (item: PlanItem) => void;
}

const RecipeCard = ({ item, onAddToPlan }: RecipeCardProps) => {
    const dispatch = useAppDispatch();
    const isRestaurant = item.restaurant;
    const name = isRestaurant ? item.dish : item.name;
    const description = isRestaurant ? `${item.score}` : item.time_min;

    const handleCardClick = () => {
        if (!isRestaurant) {
            dispatch(selectRecipe(item));
        }
    }

    const handleAddToPlanClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onAddToPlan(item);
    };

    return (
        <div className="result-card" onClick={handleCardClick} style={{ cursor: isRestaurant ? 'default' : 'pointer' }}>
            <div className="result-card-content">
                <div className="result-card-header">
                    <h4>{name}</h4>
                    {isRestaurant && <span className="distance">{item.distance_km.toFixed(1)} км</span>}
                </div>
                {isRestaurant ? (
                     <div className="result-card-footer">
                        <p className="result-card-description">Оценка: {description} ⭐️</p>
                        <span className="restaurant-name">{item.restaurant}</span>
                    </div>
                ) : (
                    <>
                        <p className="result-card-description"><i>~{description} мин.</i></p>
                        {item.tags && Array.isArray(item.tags) && (
                             <div className="result-card-tags">
                                {item.tags.map((tag: string) => (
                                    <span key={tag} className="result-card-tag" data-tag={tag}>{TAG_NAMES[tag] || tag}</span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="result-card-right-col">
                 <img
                    className="result-card-image"
                    src={`https://placehold.co/110x88?text=${encodeURIComponent(name)}`}
                    alt={name}
                />
                <div className="result-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleAddToPlanClick}>
                        Добавить в план
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
