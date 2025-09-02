import type { PlanItem } from "../../store/slices/appSlice";
import { useAppDispatch } from "../../store/hooks";
import { selectRecipe } from "../../store/slices/appSlice";

interface PlanCardProps {
    item: PlanItem;
    onRemove: () => void;
}

const PlanCard = ({ item, onRemove }: PlanCardProps) => {
    const dispatch = useAppDispatch();
    const isRestaurant = item.mode === 'restaurants';
    const name = isRestaurant ? item.dish : item.name;
    const description = isRestaurant ? `<b>${item.restaurant}</b> ${item.distance_km.toFixed(1)} км` : `~${item.time_min} мин.`;

    // A simple function to render HTML, use with caution
    const createMarkup = (htmlString: string) => {
        return { __html: htmlString };
    };

    const handleCardClick = () => {
        if (!isRestaurant) {
            dispatch(selectRecipe(item));
        }
    }

    return (
        <div className="result-card compact" onClick={handleCardClick} style={{ cursor: isRestaurant ? 'default' : 'pointer' }}>
            <div className="result-card-content">
                <div className="result-card-header">
                    <h4>{name}</h4>
                </div>
                <p className="result-card-description" dangerouslySetInnerHTML={createMarkup(description)}></p>
            </div>
            <button
                className="remove-from-plan-btn"
                title="Удалить из плана"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
            >
                &times;
            </button>
        </div>
    );
};

export default PlanCard;
